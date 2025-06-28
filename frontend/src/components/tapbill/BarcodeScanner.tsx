import React, { useState, useEffect, useRef } from 'react';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  isActive: boolean;
  className?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onBarcodeScanned, 
  isActive, 
  className = '' 
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentBarcodeInputRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const onBarcodeScannedRef = useRef(onBarcodeScanned);

  // Auto-focus the input when scanner becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Update the callback ref when it changes
  useEffect(() => {
    onBarcodeScannedRef.current = onBarcodeScanned;
  }, [onBarcodeScanned]);

  // Handle barcode input detection
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isActive) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastScanTimeRef.current;

      // Check if user is typing in an input field or textarea
      const activeElement = document.activeElement;
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      // If it's been more than 200ms since last character, start new scan
      if (timeDiff > 200) {
        currentBarcodeInputRef.current = '';
        setBarcodeInput('');
        setIsScanning(true);
      }

      // Only process single character keys (not special keys like Shift, Ctrl, etc.)
      if (event.key.length === 1) {
        // Always capture barcode input when scanner is active, regardless of focus
        // This ensures we capture the complete barcode

        // Check if user is typing in a modal or barcode manager
        const isInModal = activeElement && (
          activeElement.closest('.fixed') || // Modal backdrop
          activeElement.closest('[role="dialog"]') || // Dialog role
          activeElement.closest('.modal') // Modal class
        );

        // Check if user is typing in customer search field or any customer-related input
        const isCustomerSearch = activeElement && (
          activeElement.placeholder?.includes('Customer Name') ||
          activeElement.placeholder?.toLowerCase().includes('customer') ||
          activeElement.placeholder?.toLowerCase().includes('name') ||
          activeElement.placeholder?.toLowerCase().includes('contact') ||
          activeElement.placeholder?.toLowerCase().includes('phone') ||
          activeElement.closest('.relative')?.querySelector('input[placeholder*="Customer"]') === activeElement ||
          // Check if it's in a customer-related section
          activeElement.closest('div')?.textContent?.includes('Customer') ||
          activeElement.closest('form')?.querySelector('label')?.textContent?.toLowerCase().includes('customer')
        );

        // If user is typing in a modal or customer search, don't capture for barcode scanning
        if (isInModal || isCustomerSearch) {
          return; // Let the input handle the typing normally
        }

        // Prevent the character from going to other input fields when barcode scanner is active
        if (isTypingInInput && activeElement !== inputRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Add character to barcode using ref to persist across re-renders
        currentBarcodeInputRef.current += event.key;
        setBarcodeInput(currentBarcodeInputRef.current);
        lastScanTimeRef.current = currentTime;

        console.log('Barcode building:', currentBarcodeInputRef.current);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout to process barcode after 200ms of no input
        timeoutRef.current = setTimeout(() => {
          if (currentBarcodeInputRef.current.length >= 3) { // Minimum barcode length
            console.log('Processing complete barcode:', currentBarcodeInputRef.current);
            onBarcodeScannedRef.current(currentBarcodeInputRef.current.trim());
            currentBarcodeInputRef.current = '';
            setBarcodeInput('');
            setIsScanning(false);
          }
        }, 200);
      }

      // Handle Enter key (some scanners send this)
      if (event.key === 'Enter' && currentBarcodeInputRef.current.length >= 3) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Processing complete barcode (Enter):', currentBarcodeInputRef.current);
        onBarcodeScannedRef.current(currentBarcodeInputRef.current.trim());
        currentBarcodeInputRef.current = '';
        setBarcodeInput('');
        setIsScanning(false);
      }
    };

    // Additional keydown handler to prevent barcode characters from reaching other inputs
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isActive) return;

      const activeElement = document.activeElement;
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      // Check if user is typing in a modal
      const isInModal = activeElement && (
        activeElement.closest('.fixed') || // Modal backdrop
        activeElement.closest('[role="dialog"]') || // Dialog role
        activeElement.closest('.modal') // Modal class
      );

      // Check if user is typing in customer search field or any customer-related input
      const isCustomerSearch = activeElement && (
        activeElement.placeholder?.includes('Customer Name') ||
        activeElement.placeholder?.toLowerCase().includes('customer') ||
        activeElement.placeholder?.toLowerCase().includes('name') ||
        activeElement.placeholder?.toLowerCase().includes('contact') ||
        activeElement.placeholder?.toLowerCase().includes('phone') ||
        activeElement.closest('.relative')?.querySelector('input[placeholder*="Customer"]') === activeElement ||
        // Check if it's in a customer-related section
        activeElement.closest('div')?.textContent?.includes('Customer') ||
        activeElement.closest('form')?.querySelector('label')?.textContent?.toLowerCase().includes('customer')
      );

      // If barcode scanner is active and user is typing in another input field, prevent it
      // BUT allow typing in modals and customer search
      if (isTypingInInput && activeElement !== inputRef.current && !isInModal && !isCustomerSearch && event.key.length === 1) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    if (isActive) {
      document.addEventListener('keypress', handleKeyPress);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim().length >= 3) {
      onBarcodeScanned(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  if (!isActive) return null;

  return (
    <div className={`bg-white border-2 border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {isScanning ? 'Scanning...' : 'Ready to scan'}
          </span>
        </div>
        <div className="text-2xl">📱</div>
      </div>
      
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Scan barcode or type manually..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={barcodeInput.trim().length < 3}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </form>
      
      <div className="mt-2 text-xs text-gray-500">
        💡 Tip: Use a USB barcode scanner or type barcode manually
      </div>
    </div>
  );
};

export default BarcodeScanner;
