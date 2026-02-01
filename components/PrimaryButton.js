/**
 * frontend/components/PrimaryButton.js
 *
 * A simple reusable button component.
 *
 * Why create this?
 * - Reuse the same button style across screens
 * - Keep screens clean and beginner-friendly
 */

import React from 'react';
import Button from './Button';

export default function PrimaryButton({title, onPress, disabled = false}) {
  return <Button label={title} onPress={onPress} disabled={disabled} variant="primary" />;
}
