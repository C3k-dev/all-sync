import React, { useState, useRef, useEffect } from 'react';
import styles from './style.module.scss';
import Icon from '@/components/Icon/Icon';

interface UserCellProps {
    name: string;
    you?: boolean;
    owner?: boolean;
    sync_time?: string;
    sync_play?: string;
    onChange?: (newName: string) => void;
}

function UserCell({ name: initialName, you, owner, sync_time, sync_play, onChange }: UserCellProps) {
    const [localName, setLocalName] = useState(initialName);
    const spanRef = useRef<HTMLSpanElement>(null);
    const [inputWidth, setInputWidth] = useState(0);

    // 🔹 Обновляем локальный input, если пришел новый prop
    useEffect(() => {
        setLocalName(initialName);
    }, [initialName]);

    // 🔹 Моментальное обновление ширины input при каждом символе
    useEffect(() => {
        if (spanRef.current) {
            const width = spanRef.current.offsetWidth + 4;
            if (width !== inputWidth) setInputWidth(width);
        }
    }, [localName, inputWidth]);

    const updateName = () => {
        const newName = localName.trim() || initialName;
        setLocalName(newName); // на случай если убрали пробелы
        if (onChange) onChange(newName);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            updateName();
        }
    };

    const handleBlur = () => {
        updateName();
    };

    return (
        <div className={styles.userCell}>
            <div className={styles.userCell__left}>
                <div className={styles.userCell__left__avatar}>
                    {owner && (
                        <div className={styles.userCell__left__avatar__admin}>
                            <Icon icon={'/12/ic_owner'} />
                        </div>
                    )}
                    <div className={styles.userCell__left__avatar__photo}></div>
                </div>
                <div className={styles.userCell__left__info}>
                    {you ? (
                        <>
                            <input
                                className={styles.userCell__left__info__myname}
                                type="text"
                                value={localName}
                                style={{ width: inputWidth }}
                                onChange={(e) => setLocalName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleBlur}
                            />
                            <span
                                ref={spanRef}
                                className={styles.userCell__left__info__myname}
                                style={{
                                    position: 'absolute',
                                    visibility: 'hidden',
                                    whiteSpace: 'pre',
                                }}
                            >
                                {localName || ' '}
                            </span>
                        </>
                    ) : (
                        <p className={styles.userCell__left__info__name}>{initialName}</p>
                    )}
                    {you && <p className={styles.userCell__left__info__you}>(Вы)</p>}
                </div>
            </div>
            <div className={styles.userCell__right}>
                <div className={styles.userCell__right__sync}>
                    <Icon width={16} height={16} icon={`/16/${sync_play}`} />
                    <p className={styles.userCell__right__sync__time}>{sync_time}</p>
                </div>
            </div>
        </div>
    );
}

export default UserCell;
