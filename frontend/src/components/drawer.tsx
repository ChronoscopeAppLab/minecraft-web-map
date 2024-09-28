type Props = {
  title: string;
  open?: boolean | undefined;
  onClose?: () => void;
};

const Drawer = ({title, open, onClose}: Props) => {
  return (
    <>
      <div id="menu-modal-back" className={open ? '' : 'hidden'} onClick={() => onClose?.()}></div>
      <div id="menu" className={open ? '' : 'hidden'}>
        <div id="menu-header">
          <div id="menu-title">{title}</div>
        </div>
        <a href="?dim=overworld" className="menu-content">
          オーバーワールド
        </a>
        <a href="?dim=nether" className="menu-content">
          ネザー
        </a>
        <a href="?dim=end" className="menu-content">
          ジ・エンド
        </a>

        <hr className="menu-separator" />
      </div>
    </>
  );
};

export default Drawer;
