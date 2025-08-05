from flask import Flask, render_template, request, jsonify
import boto3
import json
import logging
import markdown
import requests

app = Flask(__name__)
logger = logging.getLogger(__name__)


def manual_json_extract(content):
    """Manually extract text and charts from malformed JSON as a fallback"""
    try:
        logger.info(
            f"Manual extraction input (first 200 chars): {content[:200]}")
        logger.info(
            f"Manual extraction input (last 200 chars): {content[-200:]}")

        # Extract text content with multiple patterns
        text_content = None

        # Try different patterns for finding the text field
        patterns = [
            '"text": "',
            '"text":"',
            '{"text": "',
            '{"text":"'
        ]

        for pattern in patterns:
            text_start = content.find(pattern)
            if text_start != -1:
                text_start += len(pattern)
                logger.info(
                    f"Found text start with pattern '{pattern}' at position {text_start}")

                # Find the end more carefully - look for the closing quote before charts
                # We need to find the quote that's not escaped
                pos = text_start
                while pos < len(content):
                    if content[pos] == '"' and (pos == 0 or content[pos-1] != '\\'):
                        # Check if this is followed by something that indicates end of text field
                        remaining = content[pos:pos+20]  # Look ahead 20 chars
                        if any(end_marker in remaining for end_marker in [',', '\n"charts"', ',"charts"']):
                            text_content = content[text_start:pos]
                            logger.info(f"Found text end at position {pos}")
                            break
                    pos += 1

                if text_content is not None:
                    break

        if text_content is None:
            logger.error("Could not find text content with any pattern")
            # Try a more aggressive approach - extract everything between first quote and last quote before charts
            start_quote = content.find('"', content.find('"text"') + 6)
            charts_pos = content.find('"charts"')
            if start_quote != -1 and charts_pos != -1:
                # Find the last quote before charts
                end_quote = content.rfind('"', start_quote, charts_pos)
                if end_quote > start_quote:
                    text_content = content[start_quote+1:end_quote]
                    logger.info("Used aggressive extraction method")

            if text_content is None:
                text_content = "Could not extract text content"

        # Clean up the text content
        if text_content != "Could not extract text content":
            text_content = text_content.replace('\\n', '\n').replace(
                '\\r', '\r').replace('\\t', '\t').replace('\\"', '"')

        # Extract charts array
        charts = []
        charts_patterns = [
            '"charts": [',
            '"charts":[',
            ',"charts": [',
            ',"charts":['
        ]

        for pattern in charts_patterns:
            charts_start = content.find(pattern)
            if charts_start != -1:
                charts_start += len(pattern)
                logger.info(
                    f"Found charts start with pattern '{pattern}' at position {charts_start}")

                # Find the closing bracket
                bracket_count = 1
                charts_end = charts_start
                while charts_end < len(content) and bracket_count > 0:
                    if content[charts_end] == '[':
                        bracket_count += 1
                    elif content[charts_end] == ']':
                        bracket_count -= 1
                    charts_end += 1

                if bracket_count == 0:
                    charts_content = content[charts_start:charts_end-1]
                    logger.info(f"Charts content: {charts_content[:200]}")

                    # Extract URLs using regex
                    import re
                    urls = re.findall(r'"(https?://[^"]+)"', charts_content)
                    charts = urls
                    logger.info(f"Extracted {len(charts)} chart URLs")
                break

        result = {"text": text_content, "charts": charts}
        logger.info(
            f"Manual extraction result - Text length: {len(text_content)}, Charts: {len(charts)}")
        return result

    except Exception as e:
        logger.error(f"Manual extraction failed: {e}")
        import traceback
        logger.error(f"Manual extraction traceback: {traceback.format_exc()}")
        return {"text": "Failed to extract content", "charts": []}


@app.route('/')
def chat():
    return render_template('chat.html')


@app.route('/send_message', methods=['POST'])
def send_message():
    agent_arn = "arn:aws:bedrock-agentcore:us-east-1:763406250311:runtime/main-3LjbueDZVg"
    region = 'us-east-1'
    agentcore_client = boto3.client(
        'bedrock-agentcore',
        region_name=region
    )
    message = request.json.get('message', '')
    content = []  # Initialize content outside the if block

    try:
        boto3_response = agentcore_client.invoke_agent_runtime(
            agentRuntimeArn=agent_arn,
            qualifier="DEFAULT",
            payload=json.dumps({"prompt": message})
        )

        if "text/event-stream" in boto3_response.get("contentType", ""):
            for line in boto3_response["response"].iter_lines(chunk_size=1):
                if line:
                    line = line.decode("utf-8")
                    if line.startswith("data: "):
                        line = line[6:]
                        logger.info(line)
                        content.append(line)
        else:
            # Handle non-streaming response - read the StreamingBody
            response_body = boto3_response.get("response")
            if hasattr(response_body, 'read'):
                response_text = response_body.read().decode('utf-8')
                content = [response_text]
            else:
                content = [str(response_body)
                           if response_body else "No response received"]

    except Exception as e:
        logger.error(f"Error calling Bedrock agent: {str(e)}")
        content = [f"Error: {str(e)}"]

    # Join content list into a single string for better display
    # Ensure all items in content are strings before joining
    string_content = []
    for item in content:
        if isinstance(item, str):
            string_content.append(item)
        else:
            string_content.append(str(item))

    response_text = " ".join(
        string_content) if string_content else "No response received"

    # Try to parse the response as JSON to extract text and charts
    try:
        # Remove surrounding quotes if present
        if response_text.startswith('"') and response_text.endswith('"'):
            response_text = response_text[1:-1]

        # Try to parse as JSON
        response_data = json.loads(response_text)

        # Extract text and charts from the JSON response
        text_content = response_data.get('text', '')
        charts = response_data.get('charts', [])

        logger.info(
            f"Parsed JSON response - Text length: {len(text_content)}, Charts: {len(charts)}")

    except json.JSONDecodeError:
        # If not JSON, treat as plain text (fallback for backward compatibility)
        text_content = response_text
        charts = []
        logger.info("Response is not JSON, treating as plain text")

    # Process the text content
    # Replace escaped newlines with actual newlines
    cleaned_text = text_content.replace('\\n\\n', '\n\n').replace('\\n', '\n')

    # Additional cleanup for better markdown processing
    lines = cleaned_text.split('\n')
    processed_lines = []

    for line in lines:
        line = line.strip()
        if line:
            # Detect and convert headers
            if line.startswith('# '):
                processed_lines.append(line)
            elif line.startswith('## '):
                processed_lines.append(line)
            elif line.startswith('### '):
                processed_lines.append(line)
            # Convert lines that look like headers but don't have # prefix
            elif any(keyword in line.lower() for keyword in ['analysis', 'summary', 'performance', 'breakdown']) and len(line) < 100:
                processed_lines.append(f"## {line}")
            else:
                processed_lines.append(line)
        else:
            processed_lines.append('')  # Keep empty lines for paragraph breaks

    final_text = '\n'.join(processed_lines)

    # Convert markdown to HTML
    html_response = markdown.markdown(
        final_text,
        extensions=[
            'markdown.extensions.extra',
            'markdown.extensions.codehilite',
            'markdown.extensions.fenced_code',
            'markdown.extensions.tables',
            'markdown.extensions.nl2br'
        ]
    )

    # Return both text and charts
    return jsonify({
        'response': html_response,
        'charts': charts
    })


@app.route('/send_message_local', methods=['POST'])
def send_message_local():
    message = request.json.get('message', '')

    try:
        logger.info(f"Sending request to local endpoint: {message[:100]}...")
        # Make request to local endpoint
        local_response = requests.post(
            'http://127.0.0.1:8080/invocations',
            json={"prompt": message},
            headers={'Content-Type': 'application/json'},
            timeout=900  # 15 minutes timeout
        )
        logger.info(
            f"Received response from local endpoint with status: {local_response.status_code}")

        if local_response.status_code == 200:
            # Get the response content
            response_content = local_response.text.strip()
            logger.info(
                f"Raw response content length: {len(response_content)}")
            logger.info(
                f"Raw response content (first 1000 chars): {response_content[:1000]}")
            logger.info(
                f"Raw response content (last 200 chars): {response_content[-200:]}")

            # Check if response is empty
            if not response_content:
                logger.error("Empty response from local endpoint")
                return jsonify({
                    'response': f"<span class='text-danger'>Error: Empty response from local endpoint</span>",
                    'charts': []
                })

            try:
                # Clean up potential issues with the response
                cleaned_content = response_content

                # Remove potential BOM or other invisible characters
                if cleaned_content.startswith('\ufeff'):
                    cleaned_content = cleaned_content[1:]
                    logger.info("Removed BOM from response")

                # Try to parse as JSON with control character handling
                try:
                    response_data = json.loads(cleaned_content)
                    logger.info(
                        f"Successfully parsed JSON. Type: {type(response_data)}")
                    logger.info(
                        f"JSON data keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
                    if isinstance(response_data, dict):
                        logger.info(
                            f"Text field present: {'text' in response_data}")
                        logger.info(
                            f"Charts field present: {'charts' in response_data}")
                        if 'text' in response_data:
                            logger.info(
                                f"Text content length: {len(response_data['text'])}")
                except json.JSONDecodeError as e:
                    if "Invalid control character" in str(e):
                        logger.info(
                            "Detected invalid control characters, attempting to fix...")
                        import re

                        # Fix unescaped newlines and other control characters in JSON strings
                        def fix_json_string(match):
                            content = match.group(1)
                            # Escape control characters
                            # Escape backslashes first
                            content = content.replace('\\', '\\\\')
                            content = content.replace(
                                '\n', '\\n')   # Escape newlines
                            # Escape carriage returns
                            content = content.replace('\r', '\\r')
                            content = content.replace(
                                '\t', '\\t')   # Escape tabs
                            content = content.replace(
                                '\b', '\\b')   # Escape backspaces
                            content = content.replace(
                                '\f', '\\f')   # Escape form feeds
                            return f'"{content}"'

                        # Try a different approach - manually parse the JSON structure
                        # Look for the text field and fix it specifically
                        try:
                            # Find the text field content
                            text_start = cleaned_content.find('"text": "') + 9
                            text_end = cleaned_content.rfind('",\n"charts"')

                            if text_start > 8 and text_end > text_start:
                                # Extract the problematic text content
                                text_content_raw = cleaned_content[text_start:text_end]
                                # Properly escape it
                                text_content_escaped = text_content_raw.replace('\\', '\\\\').replace(
                                    '\n', '\\n').replace('\r', '\\r').replace('\t', '\\t').replace('"', '\\"')
                                # Reconstruct the JSON
                                fixed_content = cleaned_content[:text_start] + \
                                    text_content_escaped + \
                                    cleaned_content[text_end:]
                            else:
                                # Fallback to simple replacement
                                fixed_content = cleaned_content.replace(
                                    '\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
                        except Exception as fix_error:
                            logger.error(
                                f"Error in manual JSON fix: {fix_error}")
                            # Fallback to simple replacement
                            fixed_content = cleaned_content.replace(
                                '\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
                        logger.info(
                            f"Fixed content (first 500 chars): {fixed_content[:500]}")

                        try:
                            response_data = json.loads(fixed_content)
                            logger.info(
                                "Successfully parsed JSON after fixing control characters")
                        except json.JSONDecodeError as e2:
                            logger.error(f"Still failed after fixing: {e2}")
                            logger.info(
                                "Using manual extraction as final fallback...")
                            response_data = manual_json_extract(
                                response_content)
                    else:
                        logger.error(f"Different JSON error: {e}")
                        logger.info("Using manual extraction as fallback...")
                        response_data = manual_json_extract(response_content)

                logger.info(
                    f"JSON keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")

                # If response_data is still a string, parse it again (double-encoded JSON)
                if isinstance(response_data, str):
                    logger.info(
                        "Response is double-encoded JSON, parsing again...")
                    try:
                        response_data = json.loads(response_data)
                        logger.info(
                            f"Double-parsed JSON. Type: {type(response_data)}")
                    except json.JSONDecodeError as e2:
                        logger.error(
                            f"Failed to parse double-encoded JSON: {e2}")
                        logger.error(
                            f"String content that failed: {repr(response_data[:200])}")
                        # Use manual extraction as fallback
                        logger.info(
                            "Attempting manual extraction as fallback...")
                        response_data = manual_json_extract(response_content)
                else:
                    logger.info(
                        f"Response is already parsed as {type(response_data)}, skipping double-encoding check")

                # Validate that we have the expected structure
                if not isinstance(response_data, dict):
                    logger.error(f"Expected dict, got {type(response_data)}")
                    # Try to convert to expected format
                    if isinstance(response_data, str):
                        response_data = {"text": response_data, "charts": []}
                    else:
                        return jsonify({
                            'response': f"<span class='text-danger'>Error: Invalid response format from local endpoint (got {type(response_data)})</span>",
                            'charts': []
                        })

                # Extract text and charts from the JSON response
                text_content = response_data.get('text', '')
                charts = response_data.get('charts', [])

                logger.info(f"Extracted text length: {len(text_content)}")
                logger.info(f"Text content preview: {text_content[:100]}...")
                logger.info(
                    f"Extracted charts count: {len(charts) if isinstance(charts, list) else 'Not a list'}")
                if charts:
                    logger.info(f"First chart URL: {charts[0][:100]}...")

                # Ensure charts is a list
                if not isinstance(charts, list):
                    logger.warning(
                        f"Charts is not a list, converting: {type(charts)}")
                    if charts:
                        charts = [charts]
                    else:
                        charts = []

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(
                    f"JSON error position: {e.pos if hasattr(e, 'pos') else 'unknown'}")
                logger.error(
                    f"Full response content: {repr(response_content)}")

                # Try to extract any readable text from the response
                fallback_text = f"Raw response (JSON parse failed): {response_content[:500]}..."
                return jsonify({
                    'response': f"<span class='text-danger'>Error: Invalid JSON response from local endpoint.</span><br><pre>{fallback_text}</pre>",
                    'charts': []
                })
            except Exception as e:
                logger.error(f"Unexpected error parsing response: {e}")
                logger.error(
                    f"Full response content: {repr(response_content)}")
                return jsonify({
                    'response': f"<span class='text-danger'>Error: Unexpected error parsing response: {str(e)}</span>",
                    'charts': []
                })

            logger.info(
                f"Local response - Text length: {len(text_content)}, Charts: {len(charts)}")

            # Process the text content (same processing as the other endpoint)
            cleaned_text = text_content.replace(
                '\\n\\n', '\n\n').replace('\\n', '\n')

            # Additional cleanup for better markdown processing
            lines = cleaned_text.split('\n')
            processed_lines = []

            for line in lines:
                line = line.strip()
                if line:
                    # Detect and convert headers
                    if line.startswith('# '):
                        processed_lines.append(line)
                    elif line.startswith('## '):
                        processed_lines.append(line)
                    elif line.startswith('### '):
                        processed_lines.append(line)
                    # Convert lines that look like headers but don't have # prefix
                    elif any(keyword in line.lower() for keyword in ['analysis', 'summary', 'performance', 'breakdown']) and len(line) < 100:
                        processed_lines.append(f"## {line}")
                    else:
                        processed_lines.append(line)
                else:
                    # Keep empty lines for paragraph breaks
                    processed_lines.append('')

            final_text = '\n'.join(processed_lines)

            # Convert markdown to HTML
            html_response = markdown.markdown(
                final_text,
                extensions=[
                    'markdown.extensions.extra',
                    'markdown.extensions.codehilite',
                    'markdown.extensions.fenced_code',
                    'markdown.extensions.tables',
                    'markdown.extensions.nl2br'
                ]
            )

            # Debug logging
            logger.info(
                f"Final processed text (first 200 chars): {final_text[:200]}")
            logger.info(
                f"HTML response (first 200 chars): {html_response[:200]}")
            logger.info(f"Charts to return: {charts}")

            # Return both text and charts
            return jsonify({
                'response': html_response,
                'charts': charts
            })
        else:
            logger.error(
                f"Local endpoint returned status code: {local_response.status_code}")
            return jsonify({
                'response': f"<span class='text-danger'>Error: Local endpoint returned status {local_response.status_code}</span>",
                'charts': []
            })

    except requests.exceptions.ConnectionError:
        logger.error("Connection error to local endpoint")
        return jsonify({
            'response': "<span class='text-danger'>Error: Could not connect to local endpoint (http://127.0.0.1:8080/invocations)</span>",
            'charts': []
        })
    except requests.exceptions.Timeout:
        logger.error("Timeout error to local endpoint")
        return jsonify({
            'response': "<span class='text-danger'>Error: Request to local endpoint timed out</span>",
            'charts': []
        })
    except Exception as e:
        logger.error(f"Error calling local endpoint: {str(e)}")
        return jsonify({
            'response': f"<span class='text-danger'>Error: {str(e)}</span>",
            'charts': []
        })


@app.route('/clear_chat', methods=['POST'])
def clear_chat():
    return jsonify({'status': 'cleared'})


if __name__ == '__main__':
    app.run(debug=True)
