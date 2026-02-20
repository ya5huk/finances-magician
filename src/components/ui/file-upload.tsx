'use client'

import {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type ChangeEvent,
  type HTMLAttributes,
} from 'react'

export interface FileUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  onFileSelect: (file: File) => void
  accept?: string
  disabled?: boolean
  error?: string
  maxSizeMB?: number
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,application/pdf',
  disabled = false,
  error,
  maxSizeMB = 10,
  className = '',
  ...props
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayError = error || localError

  const processFile = useCallback(
    (file: File) => {
      setLocalError(null)

      if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
        setLocalError('Only PDF files are accepted')
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setLocalError(`File must be smaller than ${maxSizeMB}MB`)
        return
      }

      setFileName(file.name)
      onFileSelect(file)
    },
    [maxSizeMB, onFileSelect],
  )

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      if (!disabled) setDragging(true)
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [disabled, processFile],
  )

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} {...props}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          p-8 border-2 border-dashed rounded-xl
          transition-colors duration-150 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground hover:bg-muted/30'}
          ${displayError ? 'border-destructive' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {fileName ? (
          <>
            {/* File selected */}
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground truncate max-w-[240px]">
                {fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click or drop to replace
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground">
                <span className="font-medium text-primary">Click to upload</span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF only, max {maxSizeMB}MB
              </p>
            </div>
          </>
        )}
      </div>
      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}
    </div>
  )
}
