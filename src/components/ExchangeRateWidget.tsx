'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Globe, Clock, AlertCircle } from 'lucide-react'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { useAppSelector } from '@/store/hooks'
import { SUPPORTED_CURRENCIES, getCurrencyByCode } from '@/utils/currency'

interface ExchangeRateWidgetProps {
  className?: string
  compact?: boolean
}

export default function ExchangeRateWidget({ className = '', compact = false }: ExchangeRateWidgetProps) {
  const settings = useAppSelector(state => state.settings.settings)
  const { rates, loading, error, lastUpdated, refresh } = useExchangeRates({
    baseCurrency: settings.currency,
    autoRefresh: true,
    refreshInterval: 1000 * 60 * 60 // Refresh every hour
  })

  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['INR', 'USD', 'EUR'])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Ensure report currency is always shown
  useEffect(() => {
    if (settings.reportCurrency && !selectedCurrencies.includes(settings.reportCurrency) && settings.reportCurrency !== settings.currency) {
      setSelectedCurrencies(prev => [settings.reportCurrency, ...prev.slice(0, 2)])
    }
  }, [settings.reportCurrency, settings.currency, selectedCurrencies])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const baseCurrency = getCurrencyByCode(settings.currency)

  if (compact) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Exchange Rates</span>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={loading || isRefreshing}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">Base: 1 {settings.currency}</p>

        {loading && !rates ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : error && !rates ? (
          <div className="flex items-center space-x-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Using cached rates</span>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedCurrencies
              .filter(code => code !== settings.currency)
              .slice(0, 3)
              .map(code => {
                const currency = getCurrencyByCode(code)
                const rate = rates?.rates[code]
                return (
                  <div key={code} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{currency.flag}</span>
                      <span className="text-sm text-gray-600">{code}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900" title={`1 ${settings.currency} = ${rate ? rate.toFixed(4) : '—'} ${code}`}>
                      {rate ? `${rate.toFixed(4)} ${code}` : '—'}
                    </span>
                  </div>
                )
              })}
          </div>
        )}

        {lastUpdated && (
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center space-x-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>Updated {formatTimeAgo(lastUpdated)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Exchange Rates</h3>
            <p className="text-sm text-gray-500">
              Base: {baseCurrency.flag} {baseCurrency.name}
            </p>
          </div>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={loading || isRefreshing}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && !rates ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-24 h-5 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error && !rates ? (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center space-x-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Unable to fetch live rates</span>
          </div>
          <p className="mt-1 text-sm text-amber-600">Using cached or fallback rates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUPPORTED_CURRENCIES
            .filter(c => c.code !== settings.currency)
            .slice(0, 8)
            .map(currency => {
              const rate = rates?.rates[currency.code]
              const isReportCurrency = currency.code === settings.reportCurrency
              
              return (
                <div 
                  key={currency.code} 
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isReportCurrency 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{currency.flag}</span>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-gray-900">{currency.code}</span>
                        {isReportCurrency && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            Report
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{currency.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {rate ? rate.toFixed(4) : '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      1 {settings.currency} = {rate?.toFixed(2)} {currency.code}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {lastUpdated && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <span className="text-xs">Source: frankfurter.app</span>
        </div>
      )}

      {rates?.date && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          Rate date: {rates.date}
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
