// Shared reusable transaction button with confirmation state
import { useWaitForTransactionReceipt } from 'wagmi'
import { useEffect } from 'react'

export default function TxButton({ hash, isPending, isConfirming: externalConfirming, onClick, disabled, label, pendingLabel = 'Confirm in wallet...', confirmingLabel = 'Confirming...', className = '', onSuccess }) {
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && onSuccess) onSuccess()
  }, [isSuccess])

  const loading = isPending || isConfirming || externalConfirming

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {isPending ? pendingLabel : isConfirming ? confirmingLabel : label}
    </button>
  )
}

export function SuccessBadge({ hash }) {
  const { isSuccess } = useWaitForTransactionReceipt({ hash })
  if (!isSuccess) return null
  return (
    <p className="text-green-400 text-sm mt-3 text-center">✓ Transaction confirmed</p>
  )
}
