import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrinterConfigService, { PrinterWidth, PrinterSettings } from '@/services/printerConfig';
import BarcodeManager from '@/components/tapbill/BarcodeManager';
import { getAvailablePrinters } from '@/services/printService';

const PrintSettings: React.FC = () => {
  const navigate = useNavigate();
  const [currentSettings, setCurrentSettings] = useState<PrinterSettings>(PrinterConfigService.getSettings());
  const [showBarcodeManager, setShowBarcodeManager] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);

  const navigateToMenu = () => {
    navigate('/menu');
  };

  // Load available printers on component mount
  useEffect(() => {
    loadAvailablePrinters();
  }, []);

  const loadAvailablePrinters = async () => {
    setLoading(true);
    try {
      const printers = await getAvailablePrinters();
      setAvailablePrinters(printers);

      // Auto-detect printer width if enabled
      if (currentSettings.autoDetect && printers.length > 0) {
        autoDetectPrinterWidth(printers);
      }
    } catch (error) {
      console.error('Error loading printers:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoDetectPrinterWidth = (printers: any[]) => {
    for (const printer of printers) {
      const detectedWidth = PrinterConfigService.detectPrinterWidth(printer.name);
      if (detectedWidth) {
        console.log(`Auto-detected ${printer.name} as ${detectedWidth}`);
        updateSettings({
          selectedWidth: detectedWidth,
          selectedPrinter: printer.name
        });
        break;
      }
    }
  };

  const updateSettings = (newSettings: Partial<PrinterSettings>) => {
    const updated = { ...currentSettings, ...newSettings };
    setCurrentSettings(updated);
    PrinterConfigService.saveSettings(updated);
  };

  const handleWidthChange = (width: PrinterWidth) => {
    updateSettings({ selectedWidth: width });
  };

  const handlePrinterChange = (printerName: string) => {
    updateSettings({ selectedPrinter: printerName });

    // Auto-detect width for selected printer
    if (currentSettings.autoDetect) {
      const detectedWidth = PrinterConfigService.detectPrinterWidth(printerName);
      if (detectedWidth) {
        updateSettings({ selectedWidth: detectedWidth });
      }
    }
  };

  const handleAutoDetectToggle = (autoDetect: boolean) => {
    updateSettings({ autoDetect });

    if (autoDetect && availablePrinters.length > 0) {
      autoDetectPrinterWidth(availablePrinters);
    }
  };

  const handleTestPrint = async () => {
    setTestPrinting(true);
    try {
      const testBillData = {
        billNo: 'TEST-001',
        items: [
          { name: 'Test Item 1', quantity: 1, price: 10.00, total: 10.00 },
          { name: 'Test Item 2', quantity: 2, price: 15.50, total: 31.00 }
        ],
        total: 41.00,
        createdAt: new Date(),
        shopDetails: {
          name: 'TapBill Test Print',
          address: 'Test Address',
          phone: '1234567890'
        }
      };

      // Import print service dynamically to avoid circular imports
      const { printReceipt } = await import('@/services/printService');
      const success = await printReceipt(testBillData, {
        printerName: currentSettings.selectedPrinter,
        silent: true
      });

      if (success) {
        alert(`✅ Test print successful!\nPrinter: ${currentSettings.selectedPrinter || 'Default'}\nWidth: ${currentSettings.selectedWidth}`);
      } else {
        alert(`❌ Test print failed. Please check your printer connection.`);
      }
    } catch (error) {
      console.error('Test print error:', error);
      alert(`❌ Test print error: ${error}`);
    } finally {
      setTestPrinting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToMenu} className="text-lg">☰</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Print Settings
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">Version 1.0</div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">🖨️ Print & Barcode Settings</h1>

          {/* Current Settings Display */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Current Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Paper Width</div>
                <div className="text-xl font-bold text-blue-800">{currentSettings.selectedWidth}</div>
                <div className="text-xs text-blue-600">
                  {currentSettings.selectedWidth === '58mm' ? 'Compact receipts' : 'Standard receipts'}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Selected Printer</div>
                <div className="text-lg font-bold text-green-800 truncate">
                  {currentSettings.selectedPrinter || 'Default Printer'}
                </div>
                <div className="text-xs text-green-600">Active printer</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Auto-Detection</div>
                <div className="text-lg font-bold text-purple-800">
                  {currentSettings.autoDetect ? 'Enabled' : 'Disabled'}
                </div>
                <div className="text-xs text-purple-600">
                  {currentSettings.autoDetect ? 'Smart detection' : 'Manual setup'}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Barcode Scanning</div>
                <div className="text-lg font-bold text-orange-800">Ready</div>
                <div className="text-xs text-orange-600">USB/Wireless support</div>
              </div>
            </div>
          </div>

          {/* Printer Width Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📏 Thermal Paper Width</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleWidthChange('58mm')}
                className={`p-6 border-2 rounded-lg text-center transition-colors ${
                  currentSettings.selectedWidth === '58mm'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl font-bold mb-2">58mm</div>
                <div className="text-sm text-gray-600 mb-1">Small thermal rolls</div>
                <div className="text-xs text-gray-500">Compact receipts, space-efficient</div>
                <div className="text-xs text-blue-600 mt-2">Font: 9px | Width: 50mm</div>
              </button>
              <button
                onClick={() => handleWidthChange('80mm')}
                className={`p-6 border-2 rounded-lg text-center transition-colors ${
                  currentSettings.selectedWidth === '80mm'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl font-bold mb-2">80mm</div>
                <div className="text-sm text-gray-600 mb-1">Standard thermal rolls</div>
                <div className="text-xs text-gray-500">More spacing, easier to read</div>
                <div className="text-xs text-blue-600 mt-2">Font: 12px | Width: 72mm</div>
              </button>
            </div>

            {/* Auto-Detection */}
            <div className="mb-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={currentSettings.autoDetect}
                  onChange={(e) => handleAutoDetectToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  🔍 Auto-detect printer width based on printer model
                </span>
              </label>
            </div>

            {/* Printer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🖨️ Select Printer
              </label>
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading printers...</div>
              ) : (
                <select
                  value={currentSettings.selectedPrinter}
                  onChange={(e) => handlePrinterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default Printer</option>
                  {availablePrinters.map((printer, index) => (
                    <option key={index} value={printer.name}>
                      {printer.name} {printer.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{/* Barcode Management Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 Barcode Management</h3>
              <p className="text-gray-600 mb-4">
                Manage barcodes for menu items to enable quick scanning during billing.
              </p>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>USB barcode scanner support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Wireless scanner compatibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Manual barcode entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Automatic item identification</span>
                </div>
              </div>
              <button
                onClick={() => setShowBarcodeManager(true)}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                🏷️ Manage Item Barcodes
              </button>
            </div>

            {/* Test Print Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🧪 Test Print</h3>
              <p className="text-gray-600 mb-4">
                Test your printer settings with a sample receipt to ensure everything is working correctly.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-gray-700">
                  <div><strong>Current Settings:</strong></div>
                  <div>• Paper Width: {currentSettings.selectedWidth}</div>
                  <div>• Printer: {currentSettings.selectedPrinter || 'Default'}</div>
                  <div>• Auto-detect: {currentSettings.autoDetect ? 'On' : 'Off'}</div>
                </div>
              </div>
              <button
                onClick={handleTestPrint}
                disabled={testPrinting}
                className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {testPrinting ? '🖨️ Printing Test...' : '🧪 Print Test Receipt'}
              </button>
            </div>

          </div>

          {/* Feature Highlights */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Enhanced Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">📏</div>
                <h4 className="font-medium text-gray-800">Dynamic Width Support</h4>
                <p className="text-sm text-gray-600">Auto-adjusts for 58mm or 80mm thermal paper</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-medium text-gray-800">Barcode Scanning</h4>
                <p className="text-sm text-gray-600">USB/wireless scanner support for quick billing</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-medium text-gray-800">Auto-Detection</h4>
                <p className="text-sm text-gray-600">Smart printer model detection</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🧪</div>
                <h4 className="font-medium text-gray-800">Test Printing</h4>
                <p className="text-sm text-gray-600">Verify settings before production</p>
              </div>
            </div>
          </div>

          {/* Print Quality Tips */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Print Quality Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Ensure thermal paper is properly loaded</div>
                <div>• Check printer driver installation</div>
                <div>• Use correct paper width setting</div>
                <div>• Test print before production use</div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Keep thermal paper away from heat</div>
                <div>• Clean printer head regularly</div>
                <div>• Use quality thermal paper rolls</div>
                <div>• Check USB/network connections</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Manager Modal */}
      <BarcodeManager
        isOpen={showBarcodeManager}
        onClose={() => setShowBarcodeManager(false)}
        onBarcodeUpdated={() => {
          console.log('Barcode updated successfully');
        }}
      />
    </div>
  );
};

export default PrintSettings;
