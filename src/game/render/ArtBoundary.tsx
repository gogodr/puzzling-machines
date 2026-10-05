import { Component, Suspense, type ReactNode } from 'react'

interface State {
  failed: boolean
}

class Boundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  override componentDidCatch(error: unknown) {
    console.warn('[art] image failed to load; drawing without it', error)
  }

  override render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Images are decoration: while loading, or if one is missing, the game keeps running without it. */
export function ArtBoundary({ children }: { children: ReactNode }) {
  return (
    <Boundary>
      <Suspense fallback={null}>{children}</Suspense>
    </Boundary>
  )
}
