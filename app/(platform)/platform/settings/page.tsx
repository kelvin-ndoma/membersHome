"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export default function PlatformSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    allowCustomDomains: true,
    enableMultiTenancy: true,
    enableMemberMessaging: true,
    enableMemberDirectory: true,
    platformFeePercent: 0,
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/platform/settings")
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/platform/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" })
      } else {
        setMessage({ type: "error", text: "Failed to save settings" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Platform Settings</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Allow Custom Domains</label>
                <p className="text-sm text-gray-500">Organizations can use their own domains</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowCustomDomains}
                onChange={(e) => setSettings({ ...settings, allowCustomDomains: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Enable Multi-Tenancy</label>
                <p className="text-sm text-gray-500">Allow organizations to have multiple houses</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMultiTenancy}
                onChange={(e) => setSettings({ ...settings, enableMultiTenancy: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Enable Member Messaging</label>
                <p className="text-sm text-gray-500">Allow members to message each other</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMemberMessaging}
                onChange={(e) => setSettings({ ...settings, enableMemberMessaging: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Enable Member Directory</label>
                <p className="text-sm text-gray-500">Show member directory in portals</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMemberDirectory}
                onChange={(e) => setSettings({ ...settings, enableMemberDirectory: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Platform Fee Percentage</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={settings.platformFeePercent}
                onChange={(e) => setSettings({ ...settings, platformFeePercent: parseFloat(e.target.value) })}
                className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Percentage fee on all transactions</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  )
}