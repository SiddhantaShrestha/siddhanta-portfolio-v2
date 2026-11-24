"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onError: (error: Error) => void;
};

type State = { hasError: boolean };

/**
 * Catches chunk load failures and render errors from the 3D experience.
 * The shell then falls back to the poster. The rest of the page is untouched.
 */
export class ExperienceErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  override render() {
    return this.state.hasError ? null : this.props.children;
  }
}
