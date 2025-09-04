import React from 'react';
import styles from './style.module.scss';

interface ActiveDetailCellProps {
    time: string;
    name: string;
    active: string;
}

function ActiveDetailCell(props: ActiveDetailCellProps) {
  return (
    <div className={styles.activeDetailCell}>
        <div className={styles.activeDetailCell__left}>
            <p className={styles.activeDetailCell__left__time}>{props.time}</p>
            <p className={styles.activeDetailCell__left__name}>{props.name}</p>
        </div>
        <div className={styles.activeDetailCell__right}>
            <p className={styles.activeDetailCell__right__active}>{props.active}</p>
        </div>
    </div>
  )
}

export default ActiveDetailCell