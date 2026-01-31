import React, { useState, useRef, useEffect } from 'react';
import styles from './NicknameManager.module.css';
import { NicknameProvider, NicknameStore, truncateAddress } from '../../utils/nickname-store';

interface NicknameManagerProps {
  nicknames: NicknameProvider;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Called when nicknames change to trigger re-render
}

export default function NicknameManager({ nicknames, isOpen, onClose, onUpdate }: NicknameManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addNickname, setAddNickname] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get all nicknames as array for display
  const allNicknames = Array.from(nicknames.getAll().entries());
  const filteredNicknames = allNicknames.filter(([address, nickname]) =>
    address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAdd = () => {
    setAddError(null);
    const addr = addAddress.trim();
    const nick = addNickname.trim();

    if (!addr) {
      setAddError('Address is required');
      return;
    }
    if (addr.length < 32 || addr.length > 44) {
      setAddError('Invalid Solana address');
      return;
    }
    if (!nick) {
      setAddError('Nickname is required');
      return;
    }

    try {
      nicknames.set(addr, nick);
      setAddAddress('');
      setAddNickname('');
      onUpdate();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add');
    }
  };

  const handleEdit = (address: string) => {
    const current = nicknames.get(address);
    setEditingAddress(address);
    setEditValue(current || '');
  };

  const handleSaveEdit = () => {
    if (editingAddress && editValue.trim()) {
      nicknames.set(editingAddress, editValue.trim());
      onUpdate();
    }
    setEditingAddress(null);
  };

  const handleRemove = (address: string) => {
    nicknames.remove(address);
    onUpdate();
    if (editingAddress === address) {
      setEditingAddress(null);
    }
  };

  const handleExport = () => {
    const store = nicknames.export();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solana-nicknames-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const store: NicknameStore = JSON.parse(content);
        nicknames.import(store, false); // Don't overwrite existing
        onUpdate();
      } catch (err) {
        console.error('Failed to import nicknames:', err);
        alert('Failed to import nicknames. Make sure the file is valid JSON.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all nicknames? This cannot be undone.')) {
      nicknames.clear();
      onUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2>Manage Nicknames</h2>
          <button onClick={onClose} className={styles.closeButton} title="Close">
            &times;
          </button>
        </div>

        <div className={styles.privacy}>
          Nicknames are stored locally in your browser and never sent to any server.
        </div>

        {/* Add new nickname */}
        <div className={styles.addSection}>
          <h3>Add Nickname</h3>
          <div className={styles.addForm}>
            <input
              type="text"
              value={addAddress}
              onChange={(e) => setAddAddress(e.target.value)}
              placeholder="Solana address"
              className={styles.addressInput}
            />
            <input
              type="text"
              value={addNickname}
              onChange={(e) => setAddNickname(e.target.value)}
              placeholder="Nickname"
              className={styles.nicknameInput}
              maxLength={50}
            />
            <button onClick={handleAdd} className={styles.addButton}>
              Add
            </button>
          </div>
          {addError && <div className={styles.error}>{addError}</div>}
        </div>

        {/* Search and list */}
        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <h3>Your Nicknames ({nicknames.count()})</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.nicknameList}>
            {filteredNicknames.length === 0 ? (
              <div className={styles.empty}>
                {allNicknames.length === 0
                  ? 'No nicknames yet. Add one above or click "Nickname" on any address.'
                  : 'No matches found.'}
              </div>
            ) : (
              filteredNicknames.map(([address, nickname]) => (
                <div key={address} className={styles.nicknameRow}>
                  {editingAddress === address ? (
                    <div className={styles.editRow}>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingAddress(null);
                        }}
                      />
                      <button onClick={handleSaveEdit} className={styles.saveButton}>
                        Save
                      </button>
                      <button onClick={() => setEditingAddress(null)} className={styles.cancelButton}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.nicknameInfo}>
                        <span className={styles.nickname}>{nickname}</span>
                        <span className={styles.address}>{truncateAddress(address, 6)}</span>
                      </div>
                      <div className={styles.rowActions}>
                        <button onClick={() => handleEdit(address)} className={styles.rowButton}>
                          Edit
                        </button>
                        <button onClick={() => handleRemove(address)} className={styles.rowButton}>
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Import/Export */}
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <button onClick={handleExport} className={styles.footerButton} disabled={nicknames.count() === 0}>
              Export JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={styles.footerButton}>
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            {nicknames.count() > 0 && (
              <button onClick={handleClearAll} className={styles.dangerButton}>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
