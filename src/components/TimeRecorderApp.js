import React, { useState, useEffect } from 'react';
import './TimeRecorderApp.css'; // CSSファイルをインポート

const TimeRecorderApp = () => {
  // モバイル向けにビューポートの高さを設定
  useEffect(() => {
    const setViewHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewHeight();
    window.addEventListener('resize', setViewHeight);
    
    return () => window.removeEventListener('resize', setViewHeight);
  }, []);

  // 状態の定義
  const [records, setRecords] = useState(() => {
    const savedRecords = localStorage.getItem('timeRecords');
    return savedRecords ? JSON.parse(savedRecords) : [];
  });
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingRecord, setEditingRecord] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [defaultBreakTime, setDefaultBreakTime] = useState(60); // デフォルト休憩時間（分）

  // 画面サイズの変更を検出
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 現在時刻を更新する効果
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // レコードが変更されたときにローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('timeRecords', JSON.stringify(records));
  }, [records]);

  // 勤務開始
  const handleStart = () => {
    const time = new Date();
    setIsWorking(true);
    setStartTime(time);
  };

  // 勤務終了
  const handleEnd = () => {
    const endTime = new Date();
    setIsWorking(false);
    setRecords([
      ...records,
      {
        id: Date.now(),
        date: formatDate(endTime),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        duration: calculateDuration(startTime, endTime),
        breakMinutes: defaultBreakTime // デフォルト休憩時間を設定
      }
    ]);
    setStartTime(null);
  };

  // レコード削除
  const handleDelete = (id) => {
    setRecords(records.filter(record => record.id !== id));
    // 削除する記録が現在編集中の場合、編集状態をクリアする
    if (editingRecord && editingRecord.id === id) {
      setEditingRecord(null);
    }
    if (activeRecordId === id) {
      setActiveRecordId(null);
    }
  };
  
  // レコードをアクティブにする
  const handleRecordClick = (id) => {
    setActiveRecordId(activeRecordId === id ? null : id);
  };
  
  // 編集モードを開始
  const handleEdit = (record) => {
    setEditingRecord({
      ...record,
      startTimeInput: record.startTime,
      endTimeInput: record.endTime,
      dateInput: record.date,
      breakMinutesInput: record.breakMinutes || defaultBreakTime
    });
    
    // モバイルの場合、編集フォームが見えるようにスクロール
    if (isMobile) {
      setTimeout(() => {
        const editForm = document.getElementById('mobile-edit-form');
        if (editForm) {
          editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };
  
  // 編集をキャンセル
  const handleCancelEdit = () => {
    setEditingRecord(null);
  };
  
  // 編集を保存
  const handleSaveEdit = () => {
    if (!editingRecord) return;
    
    // 新しい日付と時間の文字列からDateオブジェクトを作成
    const startDate = new Date(`${editingRecord.dateInput}T${editingRecord.startTimeInput}`);
    const endDate = new Date(`${editingRecord.dateInput}T${editingRecord.endTimeInput}`);
    
    // 時間の差が負にならないか確認
    if (endDate <= startDate) {
      alert('終了時間は開始時間より後にしてください');
      return;
    }

    // 休憩時間の検証
    const breakMinutes = parseInt(editingRecord.breakMinutesInput);
    if (isNaN(breakMinutes) || breakMinutes < 0) {
      alert('休憩時間は0分以上の数値を入力してください');
      return;
    }
    
    // 更新されたレコードを作成
    const updatedRecord = {
      ...editingRecord,
      date: editingRecord.dateInput,
      startTime: editingRecord.startTimeInput,
      endTime: editingRecord.endTimeInput,
      breakMinutes: breakMinutes,
      duration: calculateDuration(startDate, endDate)
    };
    
    // レコード配列を更新
    setRecords(
      records.map(record => 
        record.id === updatedRecord.id ? updatedRecord : record
      )
    );
    
    // 編集モードを終了
    setEditingRecord(null);
  };

  // 日付をフォーマット (YYYY-MM-DD)
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // 時刻をフォーマット (HH:MM:SS)
  const formatTime = (date) => {
    return date.toTimeString().split(' ')[0];
  };

  // 勤務時間を計算
  const calculateDuration = (start, end) => {
    const diff = (end - start) / 1000; // 秒単位
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 実労働時間を計算（休憩時間を引いた時間）
  const calculateNetDuration = (record) => {
    if (!record || !record.duration) return '00:00:00';
    
    const [hours, minutes, seconds] = record.duration.split(':').map(num => parseInt(num, 10));
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const breakSeconds = (record.breakMinutes || 0) * 60;
    
    const netSeconds = Math.max(0, totalSeconds - breakSeconds);
    const netHours = Math.floor(netSeconds / 3600);
    const netMinutes = Math.floor((netSeconds % 3600) / 60);
    const netSecs = netSeconds % 60;
    
    return `${netHours.toString().padStart(2, '0')}:${netMinutes.toString().padStart(2, '0')}:${netSecs.toString().padStart(2, '0')}`;
  };

  // 休憩時間を表示用にフォーマット
  const formatBreakTime = (minutes) => {
    if (minutes === undefined || minutes === null) return '01:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // CSV形式でデータをエクスポート
  const exportCSV = () => {
    if (records.length === 0) return;
    
    const headers = ['日付', '開始時間', '終了時間', '休憩時間(分)', '総勤務時間', '実労働時間'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => 
        `${record.date},${record.startTime},${record.endTime},${record.breakMinutes || defaultBreakTime},${record.duration},${calculateNetDuration(record)}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `勤怠記録_${formatDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <h1 className="app-header">勤怠記録</h1>
      
      {/* 現在時刻表示 */}
      <div className="time-display">
        {currentTime.toLocaleString('ja-JP')}
      </div>
      
      {/* 打刻ボタン */}
      <div className="buttons-container">
        {!isWorking ? (
          <button 
            onClick={handleStart} 
            className="start-button"
          >
            勤務開始
          </button>
        ) : (
          <div className="working-container">
            <p className="working-text">勤務中 - 開始: {formatTime(startTime)}</p>
            <button 
              onClick={handleEnd} 
              className="end-button"
            >
              勤務終了
            </button>
          </div>
        )}
      </div>
      
      {/* 記録一覧 */}
      <div className="records-container">
        <div className="records-header">
          <h2 className="records-title">勤怠記録</h2>
          <button 
            onClick={exportCSV} 
            className="export-button"
            disabled={records.length === 0}
          >
            CSVエクスポート
          </button>
        </div>
        
        {records.length > 0 ? (
          <>
            {/* モバイル表示: テーブルとアクション部分を分離 */}
            {isMobile && (
              <div className="mobile-view">
                {/* テーブル部分 */}
                <div className="table-container">
                  <table className="record-table">
                    <thead>
                      <tr className="table-header">
                        <th className="header-cell">日付</th>
                        <th className="header-cell">開始</th>
                        <th className="header-cell">終了</th>
                        <th className="header-cell">休憩</th>
                        <th className="header-cell">実働</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...records].reverse().map(record => (
                        <tr 
                          key={record.id} 
                          className={`table-row ${activeRecordId === record.id ? 'active-row' : ''}`} 
                          onClick={() => handleRecordClick(record.id)}
                        >
                          <td className="table-cell">{record.date}</td>
                          <td className="table-cell">{record.startTime}</td>
                          <td className="table-cell">{record.endTime}</td>
                          <td className="table-cell">{formatBreakTime(record.breakMinutes)}</td>
                          <td className="table-cell">{calculateNetDuration(record)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* アクティブな記録のアクションボタン */}
                {activeRecordId && (
                  <div className="mobile-actions">
                    <div className="mobile-record-info">
                      <span>選択中: {records.find(r => r.id === activeRecordId)?.date}</span>
                      <span>総時間: {records.find(r => r.id === activeRecordId)?.duration}</span>
                    </div>
                    <div className="mobile-buttons">
                      <button 
                        onClick={() => handleEdit(records.find(r => r.id === activeRecordId))}
                        className="edit-button mobile-action-button"
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleDelete(activeRecordId)}
                        className="delete-button mobile-action-button"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* デスクトップ表示: 従来のテーブル */}
            {!isMobile && (
              <div className="table-container">
                <table className="record-table">
                  <thead>
                    <tr className="table-header">
                      <th className="header-cell">日付</th>
                      <th className="header-cell">開始</th>
                      <th className="header-cell">終了</th>
                      <th className="header-cell">休憩</th>
                      <th className="header-cell">総勤務</th>
                      <th className="header-cell">実労働</th>
                      <th className="header-cell">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...records].reverse().map(record => (
                      <tr key={record.id} className="table-row">
                        {editingRecord && editingRecord.id === record.id ? (
                          // 編集モード
                          <>
                            <td className="edit-cell">
                              <input
                                type="date"
                                className="edit-input"
                                value={editingRecord.dateInput}
                                onChange={(e) => setEditingRecord({...editingRecord, dateInput: e.target.value})}
                              />
                            </td>
                            <td className="edit-cell">
                              <input
                                type="time"
                                className="edit-input"
                                value={editingRecord.startTimeInput}
                                onChange={(e) => setEditingRecord({...editingRecord, startTimeInput: e.target.value})}
                                step="1"
                              />
                            </td>
                            <td className="edit-cell">
                              <input
                                type="time"
                                className="edit-input"
                                value={editingRecord.endTimeInput}
                                onChange={(e) => setEditingRecord({...editingRecord, endTimeInput: e.target.value})}
                                step="1"
                              />
                            </td>
                            <td className="edit-cell">
                              <input
                                type="number"
                                className="edit-input"
                                value={editingRecord.breakMinutesInput}
                                onChange={(e) => setEditingRecord({...editingRecord, breakMinutesInput: e.target.value})}
                                min="0"
                              />
                            </td>
                            <td className="table-cell">{record.duration}</td>
                            <td className="table-cell">{calculateNetDuration({...record, breakMinutes: editingRecord.breakMinutesInput})}</td>
                            <td className="edit-cell">
                              <div className="action-buttons">
                                <button
                                  onClick={handleSaveEdit}
                                  className="save-button"
                                >
                                  保存
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="cancel-button"
                                >
                                  キャンセル
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // 表示モード
                          <>
                            <td className="table-cell">{record.date}</td>
                            <td className="table-cell">{record.startTime}</td>
                            <td className="table-cell">{record.endTime}</td>
                            <td className="table-cell">{formatBreakTime(record.breakMinutes)}</td>
                            <td className="table-cell">{record.duration}</td>
                            <td className="table-cell">{calculateNetDuration(record)}</td>
                            <td className="table-cell">
                              <div className="action-buttons">
                                <button 
                                  onClick={() => handleEdit(record)}
                                  className="edit-button"
                                >
                                  編集
                                </button>
                                <button 
                                  onClick={() => handleDelete(record.id)}
                                  className="delete-button"
                                >
                                  削除
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="no-records">記録がありません</p>
        )}
      </div>
      
      {/* モバイル用の編集フォーム */}
      {isMobile && editingRecord && (
        <div className="mobile-edit-form" id="mobile-edit-form">
          <h3 className="mobile-edit-header">勤怠記録を編集</h3>
          <div className="mobile-edit-grid">
            <div>
              <label className="mobile-edit-label">日付</label>
              <input
                type="date"
                className="edit-input"
                value={editingRecord.dateInput}
                onChange={(e) => setEditingRecord({...editingRecord, dateInput: e.target.value})}
              />
            </div>
            <div>
              <label className="mobile-edit-label">開始時間</label>
              <input
                type="time"
                className="edit-input"
                value={editingRecord.startTimeInput}
                onChange={(e) => setEditingRecord({...editingRecord, startTimeInput: e.target.value})}
                step="1"
              />
            </div>
            <div>
              <label className="mobile-edit-label">終了時間</label>
              <input
                type="time"
                className="edit-input"
                value={editingRecord.endTimeInput}
                onChange={(e) => setEditingRecord({...editingRecord, endTimeInput: e.target.value})}
                step="1"
              />
            </div>
            <div>
              <label className="mobile-edit-label">休憩時間 (分)</label>
              <input
                type="number"
                className="edit-input"
                value={editingRecord.breakMinutesInput}
                onChange={(e) => setEditingRecord({...editingRecord, breakMinutesInput: e.target.value})}
                min="0"
              />
            </div>
          </div>
          <div className="mobile-edit-actions">
            <button
              onClick={handleCancelEdit}
              className="mobile-cancel-button"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveEdit}
              className="mobile-save-button"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRecorderApp;