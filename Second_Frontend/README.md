# CogniSpeech Frontend

## 🎤 Enhanced WebM Audio Recording Support

### WebM Format Features
- **Primary Recording Format**: WebM is the default and preferred format for web microphone recordings
- **Codec Support**: 
  - Opus codec (best quality, most compatible)
  - Vorbis codec (good quality, wide support)
  - Browser default codec fallback
- **Optimized Settings**: 
  - Mono recording (1 channel) for better analysis
  - 44.1kHz sample rate
  - 128kbps bitrate optimization for voice
  - Adaptive chunk sizes based on codec

### Browser Compatibility
- **Chrome/Edge**: Full WebM + Opus support
- **Firefox**: WebM + Opus support
- **Safari**: WebM fallback to MP4
- **Mobile Browsers**: WebM support varies by device

### Recording Quality
- **Echo Cancellation**: Built-in noise reduction
- **Noise Suppression**: Background noise filtering
- **Auto Gain Control**: Consistent volume levels
- **Real-time Processing**: Live audio analysis

### File Handling
- **Automatic Format Detection**: Correct file extensions
- **Codec Preservation**: Maintains audio quality
- **Upload Optimization**: Efficient file transfer
- **Backend Compatibility**: Full analysis pipeline support

## Overview
The CogniSpeech Enhanced Frontend is a comprehensive, user-friendly dashboard that showcases advanced linguistic and vocal analysis capabilities. Built with React, TypeScript, and Tailwind CSS, it provides an intuitive interface for both technical and non-technical users to understand complex speech analysis results.

## ✨ Features

### 🧠 Enhanced Linguistic Analysis
- **Multi-layered AI Analysis**: Results from 5 different AI models
- **Sentence-by-Sentence Breakdown**: Individual analysis of each sentence
- **Emotion Distribution**: Visual representation of 7 emotion categories
- **Dialogue Act Analysis**: Communication style classification
- **Sentiment Confidence**: Percentage-based confidence scoring
- **Communication Style Insights**: AI-generated pattern analysis

### 🎤 Comprehensive Vocal Analysis
- **20+ Vocal Biomarkers**: All enhanced vocal metrics displayed
- **Clinical Significance**: Each metric includes clinical ranges and explanations
- **Categorized Metrics**: Organized by pitch, quality, spectral, and rate
- **Visual Indicators**: Color-coded status (normal, low, high)
- **Progress Bars**: Visual representation of metric values vs. normal ranges

### 📊 User-Friendly Dashboard
- **Tabbed Interface**: Organized into logical sections
- **Quick Stats**: At-a-glance overview of key metrics
- **Interactive Elements**: Hover effects and responsive design
- **Color-Coded System**: Intuitive visual feedback
- **Mobile Responsive**: Works on all device sizes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Second_Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## 📱 Available Pages

### 1. Demo Page (`/`)
- Landing page with feature overview
- Introduction to enhanced capabilities
- Navigation to main dashboard

### 2. Enhanced Analysis Dashboard (`/enhanced-analysis`)
- **Overview Tab**: Quick stats and summary
- **Linguistic Tab**: Detailed linguistic analysis
- **Vocal Tab**: Comprehensive vocal metrics
- **Insights Tab**: AI-generated insights and recommendations

## 🏗️ Component Structure

```
src/
├── components/
│   ├── EnhancedAnalysisDashboard.tsx    # Main dashboard component
│   ├── LinguisticAnalysisVisualization.tsx  # Linguistic analysis display
│   ├── VocalMetricsVisualization.tsx   # Vocal metrics display
│   └── ui/                             # Reusable UI components
├── pages/
│   ├── DemoPage.tsx                    # Landing page
│   └── EnhancedAnalysisPage.tsx        # Main analysis page
└── App.tsx                             # Main application component
```

## 🎨 Design System

### Color Coding
- **Green**: Normal/healthy ranges
- **Blue**: Below normal ranges  
- **Orange**: Above normal ranges
- **Purple**: Linguistic analysis
- **Teal**: Communication patterns

### Interactive Elements
- **Hover Effects**: Enhanced user experience
- **Progress Bars**: Visual metric representation
- **Badges**: Status and category indicators
- **Icons**: Intuitive visual cues
- **Gradients**: Modern aesthetic appeal

## 🔧 Customization

### Adding New Metrics
1. Update the `EnhancedAnalysisData` interface in components
2. Add new metric fields to the sample data
3. Create visualization components for new metrics
4. Update the dashboard to display new data

### Styling Changes
- Modify Tailwind classes in component files
- Update color schemes in the design system
- Adjust responsive breakpoints as needed

### Data Integration
- Replace `sampleEnhancedData` with real backend data
- Connect to API endpoints for live data
- Implement real-time updates and caching

## 📊 Data Structure

### Enhanced Analysis Data Interface
```typescript
interface EnhancedAnalysisData {
  // Linguistic Analysis
  overall_sentiment: string;
  overall_sentiment_score: number;
  emotions_breakdown: Record<string, number>;
  dominant_emotion: string;
  emotion_confidence: number;
  dialogue_acts_breakdown: Record<string, number>;
  primary_dialogue_act: string;
  sentence_count: number;
  sentence_analysis: Array<{...}>;
  
  // Vocal Analysis (20+ metrics)
  mean_pitch_hz: number;
  jitter_local_percent: number;
  shimmer_local_percent: number;
  mean_hnr_db: number;
  // ... additional vocal metrics
}
```

## 🎯 User Experience

### For Non-Technical Users
- **Simple Language**: Avoids technical jargon
- **Visual Cues**: Icons and colors for quick understanding
- **Summary Cards**: Condensed information display
- **Actionable Insights**: Clear recommendations

### For Technical Users
- **Detailed Metrics**: Comprehensive data display
- **Clinical Context**: Medical significance explanations
- **Technical Details**: Advanced analysis information
- **Export Options**: Data sharing capabilities

## 🔗 Backend Integration

### API Endpoints
- **Analysis Results**: `/api/v1/analysis/{id}`
- **User Analytics**: `/api/v1/analysis/user/{id}/analyses`
- **Trends**: `/api/v1/analysis/user/{id}/emotion-trends`
- **Statistics**: `/api/v1/analysis/user/{id}/statistics`

### Data Mapping
- **Linguistic Analysis**: Maps to enhanced linguistic fields
- **Vocal Analysis**: Maps to enhanced vocal biomarker fields
- **Real-time Updates**: Background task integration
- **Error Handling**: Graceful fallback for missing data

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
- Vercel, Netlify, or similar platforms
- Upload the `dist` folder contents
- Configure routing for SPA

### Environment Variables
Create `.env.local` for local development:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=CogniSpeech Enhanced Analysis
```

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:coverage
```

### E2E Testing
```bash
npm run test:e2e
```

## 📈 Performance

### Optimization Features
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Code Splitting**: Route-based code splitting
- **Image Optimization**: Optimized assets and icons

### Best Practices
- Use React DevTools for performance monitoring
- Implement proper error boundaries
- Optimize bundle size with tree shaking
- Monitor Core Web Vitals

## 🔒 Security

### Security Features
- **Input Validation**: Sanitize all user inputs
- **XSS Prevention**: Safe HTML rendering
- **CORS Configuration**: Proper cross-origin handling
- **Content Security Policy**: CSP headers implementation

## 🌐 Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills
- Modern JavaScript features
- CSS Grid and Flexbox
- Web APIs compatibility

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

## 📚 Additional Resources

### Documentation
- [Enhanced Backend Summary](../Backend/ENHANCED_BACKEND_SUMMARY.md)
- [Frontend Integration Guide](ENHANCED_FRONTEND_INTEGRATION.md)
- [API Documentation](../Backend/README.md)

### Related Projects
- [CogniSpeech Backend](../Backend/)
- [Enhanced Analysis Models](../Backend/app/services/)
- [Database Schema](../Backend/app/models/)

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Runtime Errors**
- Check browser console for error messages
- Verify API endpoints are accessible
- Ensure all dependencies are installed

**Styling Issues**
- Verify Tailwind CSS is properly configured
- Check for CSS conflicts
- Ensure responsive breakpoints are correct

## 📞 Support

### Getting Help
- Check the troubleshooting section above
- Review existing issues on GitHub
- Create a new issue with detailed information
- Contact the development team

### Feature Requests
- Submit feature requests through GitHub issues
- Provide detailed use case descriptions
- Include mockups or examples if possible

## 🎉 Conclusion

The CogniSpeech Enhanced Frontend provides a comprehensive, user-friendly interface for advanced speech analysis capabilities. It successfully bridges the gap between complex technical analysis and accessible user insights, making advanced vocal and linguistic analysis available to users of all technical levels.

### Key Benefits
- **Comprehensive Display**: Shows all enhanced analysis features
- **User-Friendly Interface**: Accessible to non-technical users
- **Professional Insights**: Valuable for clinical and research use
- **Modern Design**: Engaging and intuitive user experience
- **Scalable Architecture**: Easy to extend and maintain

The frontend is now ready for production use and can effectively showcase the full power of the enhanced backend analysis capabilities! 🚀

---

**Happy Analyzing! 🎤🧠📊**
