import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { canUseDOM } from '~/modules/dom';

interface Props {
  children: React.ReactElement;
  id: string;
}

export default class JoyridePortal extends React.Component<Props> {
  node: HTMLElement | null = null;

  componentDidMount() {
    const { id } = this.props;

    if (!canUseDOM()) {
      return;
    }

    this.node = document.createElement('div');
    this.node.id = id;

    document.body.appendChild(this.node);
  }

  componentWillUnmount() {
    if (!canUseDOM() || !this.node) {
      return;
    }

    // Clean up the DOM node - React will handle the portal cleanup automatically
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

    // createPortal handles all the React 18+ portal rendering automatically
    return ReactDOM.createPortal(children, this.node);
  }
}
