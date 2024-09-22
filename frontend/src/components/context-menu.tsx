import {CSSProperties, useRef} from 'react';

type MenuItem = {
  id: string;
  label: string;
  onClick: () => void;
};

type Props = {
  open?: boolean | undefined;
  x: number;
  y: number;
  items: MenuItem[];
};

const ContextMenu = ({open, x, y, items}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const itemElements = items.map(({id, label, onClick}) => (
    <div key={id} className="context-menu-item" onClick={onClick}>
      {label}
    </div>
  ));

  const classes = [];
  const style: CSSProperties = {};
  if (!open) {
    classes.push('invisible');
  }
  if (menuRef.current) {
    const {clientWidth: menuWidth, clientHeight: menuHeight} = menuRef.current;
    const {innerWidth: windowWidth, innerHeight: windowHeight} = window;
    if (windowWidth - x < menuWidth) {
      classes.push('left');
      style.left = 'unset';
      style.right = `${windowWidth - x}px`;
    } else {
      style.left = `${x}px`;
      style.right = 'unset';
    }
    if (windowHeight - y < menuHeight) {
      classes.push('up');
      style.top = 'unset';
      style.bottom = `${windowHeight - y}px`;
    } else {
      style.top = `${y}px`;
      style.bottom = 'unset';
    }
  }

  return (
    <div ref={menuRef} id="context-menu" className={classes.join(' ')} style={style}>
      {itemElements}
    </div>
  );
};

export default ContextMenu;
