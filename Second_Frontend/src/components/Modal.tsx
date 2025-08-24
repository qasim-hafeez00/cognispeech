"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import {
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  type ModalProps as ChakraModalProps,
} from "@chakra-ui/react"

/**
 * Props for the Modal component
 */
export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Function to call when the modal should be closed */
  onClose: () => void
  /** Title displayed in the modal header */
  title: string
  /** Content to display in the modal body */
  children: React.ReactNode
  /** Size of the modal - defaults to 'md' */
  size?: ChakraModalProps["size"]
  /** Optional footer content */
  footer?: React.ReactNode
  /** Whether to close modal when Escape key is pressed - defaults to true */
  closeOnEsc?: boolean
  /** Whether to close modal when clicking overlay - defaults to true */
  closeOnOverlayClick?: boolean
  /** Whether to show the close button - defaults to true */
  showCloseButton?: boolean
  /** Additional ARIA label for accessibility */
  ariaLabel?: string
  /** ID for the modal content (useful for testing) */
  id?: string
}

/**
 * Accessible Modal component wrapper around Chakra UI Modal
 *
 * Features:
 * - Focus trapping and restoration
 * - Keyboard navigation support (Escape to close)
 * - Proper ARIA attributes for screen readers
 * - Customizable size and footer
 * - Unit test friendly with data-testid attributes
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Confirm Action"
 *   footer={<Button onClick={onClose}>Close</Button>}
 * >
 *   Are you sure you want to proceed?
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  ariaLabel,
  id,
}) => {
  const initialFocusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEsc && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, closeOnEsc, onClose])

  return (
    <ChakraModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      closeOnEsc={closeOnEsc}
      closeOnOverlayClick={closeOnOverlayClick}
      initialFocusRef={initialFocusRef}
      isCentered
      preserveScrollBarGap
      aria-label={ariaLabel || title}
      id={id}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" data-testid="modal-overlay" />
      <ModalContent
        mx={4}
        data-testid="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-body"
      >
        <ModalHeader id="modal-title" fontSize="lg" fontWeight="semibold" data-testid="modal-header">
          {title}
        </ModalHeader>

        {showCloseButton && (
          <ModalCloseButton ref={initialFocusRef} data-testid="modal-close-button" aria-label="Close modal" />
        )}

        <ModalBody id="modal-body" data-testid="modal-body">
          {children}
        </ModalBody>

        {footer && <ModalFooter data-testid="modal-footer">{footer}</ModalFooter>}
      </ModalContent>
    </ChakraModal>
  )
}

export default Modal
