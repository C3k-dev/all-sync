import React, { useState } from 'react';
import styles from './style.module.scss';
import Icon from '@/components/Icon/Icon';
import { useRouter } from 'next/navigation';

interface RoomHeaderProps {
    id_room: string;
}

function RoomHeader({ id_room }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`allsync.com/room/${id_room}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Ошибка при копировании: ', err);
    }
  };

  const handleExit = () => {
    if (window.confirm("Вы уверены, что хотите выйти из комнаты?")) {
      router.push('/');
    }
  };

  return (
    <div className={styles.roomHeader}>
      <div className={styles.roomHeader__wrapper}>
        <div className={styles.roomHeader__wrapper__left}>
          <div 
            className={styles.roomHeader__wrapper__left__exit} 
            onClick={handleExit} 
            style={{ cursor: "pointer" }}
          >
            <Icon width={16} height={16} icon={'/16/ic_back'} />
            <span className={styles.roomHeader__wrapper__left__exit__text}>
              Выйти из комнаты
            </span>
          </div>
        </div>
        <div className={styles.roomHeader__wrapper__center}>
          <p className={styles.roomHeader__wrapper__center__id}>ID {id_room}</p>
        </div>
        <div 
          className={styles.roomHeader__wrapper__right} 
          onClick={handleCopy} 
          style={{ cursor: "pointer" }}
        >
          <p className={styles.roomHeader__wrapper__right__link}>
            {copied ? "Ссылка скопирована" : `site.com/room/${id_room}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RoomHeader;
