import React from 'react';
import { User, Phone, Shield, CreditCard, Zap, Webhook, Settings } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

export function Profile() {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${
          isDark || isHybrid ? 'text-white' : 'text-gray-900'
        }`}>
          Profile
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
          Access & verification settings
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sarah Thompson</h2>
              <p className="text-gray-600">sarah.thompson@institutional.com</p>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-[#2563EB] hover:bg-blue-50 rounded-xl transition-colors">
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-600 mb-1">Member Since</div>
            <div className="font-semibold text-gray-900">January 2025</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-600 mb-1">Last Login</div>
            <div className="font-semibold text-gray-900">2 hours ago</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-600 mb-1">Reports Downloaded</div>
            <div className="font-semibold text-gray-900">87</div>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] rounded-3xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
              Current Plan
            </div>
            <h2 className="text-2xl font-bold mb-2">PRO</h2>
            <p className="text-blue-100">Full access to intelligence platform</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">$149</div>
            <div className="text-sm text-blue-100">per month</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-200" />
            <span className="text-sm">Full Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-200" />
            <span className="text-sm">Real-time Data</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-200" />
            <span className="text-sm">Priority Support</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-200" />
            <span className="text-sm">Custom Alerts</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-white text-[#2563EB] py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
            Manage Subscription
          </button>
          <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors">
            View Invoice
          </button>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#F0FDF4] rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Verification Status</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Email Verified</div>
                <div className="text-sm text-gray-600">sarah.thompson@institutional.com</div>
              </div>
            </div>
            <span className="text-sm font-medium text-green-700">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Phone Verified</div>
                <div className="text-sm text-gray-600">+1 (555) 123-4567</div>
              </div>
            </div>
            <span className="text-sm font-medium text-green-700">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Two-Factor Authentication</div>
                <div className="text-sm text-gray-600">Add extra security layer</div>
              </div>
            </div>
            <button className="text-sm font-medium text-[#2563EB] hover:underline">
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Access Logs */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Access Logs</h2>
          <button className="text-sm text-[#2563EB] font-medium hover:text-[#1d4ed8]">
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
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">{log.action}</div>
                  <div className="text-xs text-gray-500">{log.location} • {log.ip}</div>
                </div>
              </div>
              <span className="text-xs text-gray-500">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade to Institutional</h2>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">INSTITUTIONAL</h3>
              <p className="text-gray-300">Enterprise-grade infrastructure</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Custom</div>
              <div className="text-sm text-gray-400">Contact Sales</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-gray-400" />
              <span className="text-sm">API Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Webhooks</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-sm">99.99% SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Custom Models</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Dedicated Support</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Flexible Billing</span>
            </div>
          </div>

          <button className="w-full bg-white text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            Contact Sales Team
          </button>
        </div>

        <div className="text-sm text-gray-600 text-center">
          Need help choosing a plan?{' '}
          <a href="#" className="text-[#2563EB] font-medium hover:underline">
            Compare all features
          </a>
        </div>
      </div>
    </div>
  );
}