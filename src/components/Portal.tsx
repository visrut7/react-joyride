import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

import { canUseDOM } from '~/modules/dom';

interface Props {
  children: React.ReactElement;
  id: string;
}

export default class JoyridePortal extends React.Component<Props> {
  node: HTMLElement | null = null;
  root: Root | null = null;

  componentDidMount() {
    const { id } = this.props;

    if (!canUseDOM()) {
      return;
    }

    this.node = document.createElement('div');
    this.node.id = id;

    document.body.appendChild(this.node);

    // Create root for React 18+ compatibility
    this.root = createRoot(this.node);
  }

  componentDidUpdate() {
    // No need for separate update logic with createPortal
  }

  componentWillUnmount() {
    if (!canUseDOM() || !this.node) {
      return;
    }

    // Unmount using the modern React 18+ API with setTimeout to avoid race conditions
    if (this.root) {
      setTimeout(() => {
        this.root?.unmount();
      }, 0);
      this.root = null;
    }

    if (this.node.parentNode === document.body) {
      document.body.removeChild(this.node);
      this.node = null;
    }
  }

  render() {
    if (!canUseDOM() || !this.node) {
      return null;
    }

    const { children } = this.props;

    // Use createPortal for React 18+ compatibility
    return ReactDOM.createPortal(children, this.node);
  }
}
