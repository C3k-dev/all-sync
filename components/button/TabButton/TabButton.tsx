import React from 'react';
import styles from './style.module.scss';

interface TabButtonProps {
  text: string;
  counter?: number;
  active?: boolean;
  diasbled?: boolean;
  onClick?: () => void;
}

function TabButton(props: TabButtonProps) {
  return (
    <button
      className={`${styles.tabButton} ${props.active ? styles.active : ''} ${props.diasbled ? styles.disabled : ''}`}
      onClick={props.onClick}
    >
      <p className={styles.tabButton__text}>{props.text}</p>
      {props.counter !== undefined && (
        <p className={styles.tabButton__counter}>{props.counter}</p>
      )}
    </button>
  );
}

export default TabButton;
