import React, { useState } from 'react';
import styles from './AddressDisplay.module.css';
import { truncateAddress, NicknameProvider } from '../../utils/nickname-store';

interface AddressDisplayProps {
  address: string;
  nicknames: NicknameProvider | null;
  labels?: { lookup: (addr: string) => { name: string; type: string } | null } | null;
  onNicknameChange?: (address: string, nickname: string | null) => void;
  showCopy?: boolean;
  showEdit?: boolean;
  showExplorerLink?: boolean;
}

export default function AddressDisplay({
  address,
  nicknames,
  labels,
  onNicknameChange,
  showCopy = true,
  showEdit = true,
  showExplorerLink = true,
}: AddressDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [copied, setCopied] = useState(false);

  const nickname = nicknames?.get(address);
  const label = labels?.lookup(address);
  const truncated = truncateAddress(address, 4);

  // Determine display text
  let displayText: string;
  let displayType: 'nickname' | 'label' | 'address';

  if (nickname) {
    displayText = nickname;
    displayType = 'nickname';
  } else if (label) {
    displayText = label.name;
    displayType = 'label';
  } else {
    displayText = truncated;
    displayType = 'address';
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStartEdit = () => {
    setEditValue(nickname || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && onNicknameChange) {
      onNicknameChange(address, trimmed);
    }
    setIsEditing(false);
  };

  const handleRemoveNickname = () => {
    if (onNicknameChange) {
      onNicknameChange(address, null);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <span className={styles.editContainer}>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter nickname..."
          className={styles.editInput}
          autoFocus
          maxLength={50}
        />
        <button onClick={handleSaveEdit} className={styles.editButton} title="Save">
          Save
        </button>
        {nickname && (
          <button onClick={handleRemoveNickname} className={styles.removeButton} title="Remove nickname">
            Remove
          </button>
        )}
        <button onClick={() => setIsEditing(false)} className={styles.cancelButton} title="Cancel">
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className={styles.addressContainer}>
      <span className={styles.displayText} title={address}>
        {displayText}
        {displayType === 'nickname' && (
          <span className={styles.addressSuffix}> ({truncated})</span>
        )}
      </span>

      {displayType === 'label' && (
        <span className={styles.labelBadge}>{label?.type}</span>
      )}

      <span className={styles.actions}>
        {showCopy && (
          <button
            onClick={handleCopy}
            className={styles.actionButton}
            title={copied ? 'Copied!' : 'Copy address'}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}

        {showEdit && onNicknameChange && (
          <button
            onClick={handleStartEdit}
            className={styles.actionButton}
            title={nickname ? 'Edit nickname' : 'Add nickname'}
          >
            {nickname ? 'Edit' : 'Nickname'}
          </button>
        )}

        {showExplorerLink && (
          <a
            href={`https://solscan.io/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionButton}
            title="View on Solscan"
          >
            View
          </a>
        )}
      </span>
    </span>
  );
}
