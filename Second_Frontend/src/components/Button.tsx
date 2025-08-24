import type React from "react"
import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from "@chakra-ui/react"

/**
 * Custom Button Props extending Chakra UI Button
 * Provides additional icon support and maintains theme consistency
 */
export interface ButtonProps extends Omit<ChakraButtonProps, "leftIcon" | "rightIcon"> {
  /** Button visual style variant */
  variant?: "solid" | "outline" | "ghost" | "link" | "unstyled"
  /** Button size */
  size?: "xs" | "sm" | "md" | "lg"
  /** Loading state with spinner */
  isLoading?: boolean
  /** Icon to display on the left side */
  iconLeft?: React.ReactElement
  /** Icon to display on the right side */
  iconRight?: React.ReactElement
  /** Button content */
  children: React.ReactNode
}

/**
 * Theme-aware Button component wrapping Chakra UI Button
 *
 * Features:
 * - Full Chakra UI theme integration
 * - Left/right icon support with proper spacing
 * - Accessible defaults (ARIA labels, focus management)
 * - Loading state with built-in spinner
 * - TypeScript support with proper prop inference
 *
 * @example
 * ```tsx
 * <Button variant="solid" size="md" iconLeft={<Icon />}>
 *   Click me
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "solid",
  size = "md",
  isLoading = false,
  iconLeft,
  iconRight,
  children,
  disabled,
  ...props
}) => {
  return (
    <ChakraButton
      variant={variant}
      size={size}
      isLoading={isLoading}
      leftIcon={iconLeft}
      rightIcon={iconRight}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      _focus={{
        boxShadow: "0 0 0 3px var(--chakra-colors-blue-200)",
        outline: "none",
      }}
      _focusVisible={{
        boxShadow: "0 0 0 3px var(--chakra-colors-blue-200)",
        outline: "2px solid var(--chakra-colors-blue-500)",
        outlineOffset: "2px",
      }}
      {...(isLoading && {
        "aria-label": `${children} (loading)`,
        "aria-busy": true,
      })}
      {...props}
    >
      {children}
    </ChakraButton>
  )
}

export default Button

/**
 * Button component variants for theme customization
 * Use these in your Chakra UI theme configuration:
 *
 * ```ts
 * const theme = extendTheme({
 *   components: {
 *     Button: {
 *       variants: {
 *         solid: { ... },
 *         outline: { ... }
 *       }
 *     }
 *   }
 * })
 * ```
 */
export const buttonVariants = {
  solid: "solid",
  outline: "outline",
  ghost: "ghost",
  link: "link",
  unstyled: "unstyled",
} as const

/**
 * Button sizes for consistent spacing
 */
export const buttonSizes = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
} as const

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes
