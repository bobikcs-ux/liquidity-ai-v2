import React, { useState } from 'react';
import { User, Phone, Shield, CreditCard, Zap, Webhook, Settings, Crown, Sparkles, X, Loader2, CheckCircle, Building2, Send } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useUserRole } from '../context/UserRoleContext';
import { sendInstitutionalInquiry, EMAIL_REGEX } from '../components/ProModal';

// Revolut payment link (external) - Updated checkout link
const REVOLUT_PAYMENT_URL = 'https://checkout.revolut.com/pay/d65728c7-7bee-48b1-9c48-ee51b51c9257';

// Institutional Inquiry Modal - Uses Formspree
function InstitutionalInquiryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [company, setCompany] = useState('');
  const [inquiryDetails, setInquiryDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    if (!EMAIL_REGEX.test(workEmail)) {
      setError('Please enter a valid work email address');
      return;
    }
    
    if (!company.trim()) {
      setError('Please enter your company name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await sendInstitutionalInquiry({
        fullName: fullName.trim(),
        workEmail: workEmail.trim(),
        company: company.trim(),
        inquiryDetails: inquiryDetails.trim() || 'Institutional plan inquiry',
      });
      
      if (result.success) {
        setSubmittedEmail(workEmail);
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to submit. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after animation
    setTimeout(() => {
      setSubmitted(false);
      setFullName('');
      setWorkEmail('');
      setCompany('');
      setInquiryDetails('');
      setSubmittedEmail('');
      setError('');
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className={`relative w-full max-w-lg rounded-2xl p-6 md:p-8 shadow-2xl ${
        isDark || isHybrid 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-amber-500/20' 
          : 'bg-white border border-gray-200'
      }`}>
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDark || isHybrid 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Inquiry Sent Successfully
            </h2>
            <p className={`text-base leading-relaxed ${
              isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Our team will review your request and contact you at{' '}
              <span className="font-semibold text-amber-500">{submittedEmail}</span>
            </p>
            <button
              onClick={handleClose}
              className={`mt-6 w-full py-3 px-6 font-semibold rounded-xl transition-all ${
                isDark || isHybrid
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className={`text-2xl font-bold text-center mb-2 ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Institutional Inquiry
            </h2>

            <p className={`text-center mb-6 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Contact our sales team for enterprise pricing and custom solutions
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Full Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark || isHybrid 
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500/50' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                  } outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>
              
              {/* Work Email */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Work Email <span className="text-amber-500">*</span>
                </label>
                <input
                  type="email"
                  value={workEmail}
                  onChange={(e) => {
                    setWorkEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="john@company.com"
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    error && error.includes('email')
                      ? 'border-red-500 focus:border-red-500' 
                      : isDark || isHybrid 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500/50' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                  } outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>
              
              {/* Company */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Company <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark || isHybrid 
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500/50' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                  } outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>
              
              {/* Inquiry Details */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Inquiry Details
                </label>
                <textarea
                  value={inquiryDetails}
                  onChange={(e) => setInquiryDetails(e.target.value)}
                  placeholder="Tell us about your requirements, team size, and how we can help..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                    isDark || isHybrid 
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500/50' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                  } outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Inquiry
                  </>
                )}
              </button>
            </form>
            
            {/* Privacy Note */}
            <p className={`text-xs text-center mt-4 ${
              isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Your information is secure and will only be used to respond to your inquiry.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function Profile() {
  const { uiTheme } = useAdaptiveTheme();
  const { isPro, freeReportsDownloaded, copilotQuestionsAsked, toggleAdminAccess } = useUserRole();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const [showInstitutionalModal, setShowInstitutionalModal] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpgrade = () => {
    // Open Revolut payment link in new tab
    window.open(REVOLUT_PAYMENT_URL, '_blank', 'noopener,noreferrer');
  };
  
  // Hidden admin toggle: Triple-tap on avatar
  const handleAvatarTap = () => {
    setTapCount(prev => prev + 1);
    
    // Reset tap count after 1 second
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 1000);
    
    // Trigger toggle on 5 rapid taps
    if (tapCount >= 4) {
      toggleAdminAccess();
      setTapCount(0);
    }
  };
  
  return (
    <>
    <InstitutionalInquiryModal isOpen={showInstitutionalModal} onClose={() => setShowInstitutionalModal(false)} />
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className={`text-3xl font-bold ${
            isDark || isHybrid ? 'text-white' : 'text-gray-900'
          }`}>
            Profile
          </h1>
          {isPro && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white animate-pulse">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-bold">PRO MEMBER</span>
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>
        <p className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-600'}>
          Access & verification settings
        </p>
      </div>

      {/* User Info Card */}
      <div className={`rounded-3xl shadow-sm border p-6 ${
        isDark || isHybrid ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar - 5 rapid taps to toggle admin mode */}
            <button 
              onClick={handleAvatarTap}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${
                isPro 
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                  : 'bg-gradient-to-br from-[#2563EB] to-[#1d4ed8]'
              }`}
              aria-label="User avatar"
            >
              <User className="w-8 h-8 text-white" />
            </button>
            <div>
              <h2 className={`text-xl font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                Sarah Thompson
              </h2>
              <p className={isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'}>
                sarah.thompson@institutional.com
              </p>
            </div>
          </div>
          <button className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            isDark || isHybrid 
              ? 'text-blue-400 hover:bg-gray-700' 
              : 'text-[#2563EB] hover:bg-blue-50'
          }`}>
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl ${isDark || isHybrid ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className={`text-sm mb-1 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</div>
            <div className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>January 2025</div>
          </div>
          <div className={`p-4 rounded-xl ${isDark || isHybrid ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className={`text-sm mb-1 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Last Login</div>
            <div className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>2 hours ago</div>
          </div>
          <div className={`p-4 rounded-xl ${isDark || isHybrid ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className={`text-sm mb-1 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Reports Downloaded</div>
            <div className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              {isPro ? '87' : freeReportsDownloaded}
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      {isPro ? (
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
                <Crown className="w-4 h-4" />
                Current Plan
              </div>
              <h2 className="text-3xl font-bold mb-2">PRO MEMBER</h2>
              <p className="text-amber-100">Full access to institutional-grade intelligence</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">$49</div>
              <div className="text-sm text-amber-100">per month</div>
            </div>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-200" />
              <span className="text-sm">Full Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-200" />
              <span className="text-sm">Unlimited AI Copilot</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-200" />
              <span className="text-sm">Priority Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-200" />
              <span className="text-sm">Custom Alerts</span>
            </div>
          </div>

          <div className="relative flex gap-3">
            <button className="flex-1 bg-white text-amber-600 py-3 rounded-xl font-semibold hover:bg-amber-50 transition-colors">
              Manage Subscription
            </button>
            <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors">
              View Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className={`rounded-3xl shadow-lg p-6 border-2 border-dashed ${
          isDark || isHybrid ? 'bg-gray-800/50 border-amber-500/50' : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                isDark || isHybrid ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                Current Plan
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                FREE
              </h2>
              <p className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                Limited access to platform features
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>$0</div>
              <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}>per month</div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className={`p-4 rounded-xl mb-6 ${isDark || isHybrid ? 'bg-gray-700/50' : 'bg-white'}`}>
            <h3 className={`text-sm font-medium mb-3 ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'}`}>
              Usage This Period
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>Free Reports</span>
                  <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>{freeReportsDownloaded}/1</span>
                </div>
                <div className={`h-2 rounded-full ${isDark || isHybrid ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(freeReportsDownloaded * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>AI Copilot Questions</span>
                  <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>{copilotQuestionsAsked}/3</span>
                </div>
                <div className={`h-2 rounded-full ${isDark || isHybrid ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min((copilotQuestionsAsked / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Revolut QR Code */}
          <div className="flex flex-col items-center mb-6">
            <p className={`text-sm font-medium mb-3 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>
              Scan to pay with Revolut App
            </p>
            <a 
              href={REVOLUT_PAYMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <img 
                src="/revolut-qr.png" 
                alt="Scan to pay with Revolut" 
                width={140} 
                height={140}
                className="block"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </a>
          </div>
          
          <a 
            href={REVOLUT_PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-center"
          >
            <span className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5" />
              Upgrade to PRO - $149
            </span>
          </a>
          
          {/* Payment Instructions */}
          <div className={`mt-4 p-3 rounded-xl ${isDark || isHybrid ? 'bg-gray-700/50' : 'bg-white'}`}>
            <p className={`text-xs text-center ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
              After completing payment, please email your confirmation to{' '}
              <a href="mailto:bobikcs@studio-bobikcs.com" className="text-amber-500 hover:underline font-medium">
                bobikcs@studio-bobikcs.com
              </a>{' '}
              to activate your PRO account.
            </p>
          </div>
        </div>
      )}

      {/* Verification Status */}
      <div className={`rounded-3xl shadow-sm border p-6 ${
        isDark || isHybrid ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark || isHybrid ? 'bg-green-900/30' : 'bg-[#F0FDF4]'
          }`}>
            <Phone className="w-5 h-5 text-green-600" />
          </div>
          <h2 className={`text-xl font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
            Verification Status
          </h2>
        </div>

        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-xl ${
            isDark || isHybrid ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Email Verified</div>
                <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'} style={{ fontSize: '0.875rem' }}>sarah.thompson@institutional.com</div>
              </div>
            </div>
            <span className="text-sm font-medium text-green-700">Active</span>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-xl ${
            isDark || isHybrid ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Phone Verified</div>
                <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'} style={{ fontSize: '0.875rem' }}>+1 (555) 123-4567</div>
              </div>
            </div>
            <span className="text-sm font-medium text-green-700">Active</span>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-xl ${
            isDark || isHybrid ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark || isHybrid ? 'bg-gray-600' : 'bg-gray-300'
              }`}>
                <Shield className={`w-5 h-5 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <div>
                <div className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Two-Factor Authentication</div>
                <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'} style={{ fontSize: '0.875rem' }}>Add extra security layer</div>
              </div>
            </div>
            <button className={`text-sm font-medium ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'} hover:underline`}>
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Access Logs */}
      <div className={`rounded-3xl shadow-sm border p-6 ${
        isDark || isHybrid ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Recent Access Logs</h2>
          <button className={`text-sm font-medium ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'} hover:opacity-80`}>
            View All
          </button>
        </div>

        <div className="space-y-3">
          {[
            { action: 'Dashboard View', location: 'New York, US', time: '2 hours ago', ip: '192.168.1.1' },
            { action: 'Report Download', location: 'New York, US', time: '3 hours ago', ip: '192.168.1.1' },
            { action: 'Intelligence Terminal', location: 'New York, US', time: '5 hours ago', ip: '192.168.1.1' },
            { action: 'Login', location: 'New York, US', time: '8 hours ago', ip: '192.168.1.1' },
          ].map((log, index) => (
            <div key={index} className={`flex items-center justify-between p-3 rounded-xl ${
              isDark || isHybrid ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className={`font-medium ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>{log.action}</div>
                  <div className={`text-xs font-medium ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>{log.location} • {log.ip}</div>
                </div>
              </div>
              <span className={`text-xs font-medium ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Options - Only show for non-PRO users */}
      {!isPro && (
        <div className={`rounded-3xl shadow-sm border p-6 ${
          isDark || isHybrid ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-6 ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Upgrade to Institutional</h2>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">INSTITUTIONAL</h3>
                <p className="text-gray-300">Enterprise-grade infrastructure</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">Custom</div>
                <div className="text-sm text-gray-300">Contact Sales</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-gray-300" />
                <span className="text-sm">API Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-gray-300" />
                <span className="text-sm">Webhooks</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-300" />
                <span className="text-sm">99.99% SLA</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-300" />
                <span className="text-sm">Custom Models</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-300" />
                <span className="text-sm">Dedicated Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-300" />
                <span className="text-sm">Flexible Billing</span>
              </div>
            </div>

            <button 
              onClick={() => setShowInstitutionalModal(true)}
              className="w-full bg-white text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Sales Team
            </button>
          </div>

          <div className={`text-sm text-center ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
            Need help choosing a plan?{' '}
            <a href="#" className={`font-medium hover:underline ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'}`}>
              Compare all features
            </a>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
