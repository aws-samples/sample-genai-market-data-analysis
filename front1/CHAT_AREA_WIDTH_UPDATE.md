# Chat Area Width Update

## Changes Made

### ✅ **Main Container Width**
- **Updated ChatPage container**: Changed from `max-w-7xl` to `w-[85%]` 
- **Result**: Chat area now uses 85% of the screen width instead of being constrained to a maximum width

### ✅ **Message Bubble Widths**
Enhanced message bubble widths to better utilize the wider chat area:

- **User Messages (Research Queries)**: Increased from `max-w-2xl` to `max-w-4xl`
- **Assistant Messages (Research Responses)**: Increased from `max-w-4xl` to `max-w-6xl`
- **Error Messages**: Increased from `max-w-2xl` to `max-w-4xl`
- **System Messages**: Increased from `max-w-4xl` to `max-w-6xl`

### 🎯 **Visual Impact**
- **Wider Layout**: The entire chat interface now spans 85% of the screen width
- **Better Content Display**: Research responses can now display more content horizontally
- **Professional Appearance**: Makes better use of desktop screen real estate
- **Improved Readability**: Longer financial data and analysis content fits better

### 📊 **Width Breakdown**
- **Previous**: Fixed maximum width (max-w-7xl ≈ 80rem ≈ 1280px)
- **Current**: Responsive 85% of screen width
- **Benefits**: 
  - On 1920px screens: ~1632px width (vs 1280px before)
  - On 1440px screens: ~1224px width (vs 1280px before)
  - On 1200px screens: ~1020px width (vs 1200px before)

### 🔧 **Technical Details**
- **Container Class**: `w-[85%] mx-auto` - Uses 85% width with auto margins for centering
- **Message Bubbles**: Increased max-width constraints to utilize the additional space
- **Responsive**: Maintains professional appearance across different desktop screen sizes
- **Backward Compatible**: All existing functionality preserved

## Result
The financial research tool now makes much better use of desktop screen space, providing a more immersive and professional experience for financial analysts working with large amounts of data and research content.