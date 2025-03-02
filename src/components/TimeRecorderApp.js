import React, { useState, useEffect } from 'react';

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
        duration: calculateDuration(startTime, endTime)
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
  };
  
  // 編集モードを開始
  const handleEdit = (record) => {
    setEditingRecord({
      ...record,
      startTimeInput: record.startTime,
      endTimeInput: record.endTime,
      dateInput: record.date
    });
    
    // モバイルの場合、編集フォームが見えるようにスクロール
    if (isMobile) {
      setTimeout(() => {
        const editRow = document.getElementById(`edit-row-${record.id}`);
        if (editRow) {
          editRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    
    // 更新されたレコードを作成
    const updatedRecord = {
      ...editingRecord,
      date: editingRecord.dateInput,
      startTime: editingRecord.startTimeInput,
      endTime: editingRecord.endTimeInput,
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

  // CSV形式でデータをエクスポート
  const exportCSV = () => {
    if (records.length === 0) return;
    
    const headers = ['日付', '開始時間', '終了時間', '勤務時間'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => 
        `${record.date},${record.startTime},${record.endTime},${record.duration}`
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

  // スタイルを定義
  const styles = {
    container: "flex flex-col items-center p-4 max-w-3xl mx-auto min-h-screen bg-gradient-to-b from-blue-50 to-purple-50",
    header: "text-2xl font-bold mb-4 text-center text-purple-700",
    timeDisplay: "text-xl mb-4 text-center bg-white p-3 rounded-lg shadow-md text-blue-600 font-medium",
    buttonsContainer: "mb-6 w-full flex justify-center",
    startButton: "bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg w-full max-w-xs shadow-lg transform hover:scale-105 transition-transform",
    endButton: "bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg w-full max-w-xs shadow-lg transform hover:scale-105 transition-transform",
    workingText: "mb-2 text-center text-purple-600 font-semibold",
    recordsContainer: "w-full bg-white rounded-lg shadow-md p-4",
    recordsHeader: "flex justify-between mb-4 items-center",
    recordsTitle: "text-xl font-semibold text-purple-700",
    exportButton: "bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition-transform",
    tableContainer: "overflow-x-auto w-full",
    table: "w-full border-collapse text-sm",
    tableHeader: "bg-gradient-to-r from-purple-100 to-blue-100",
    headerCell: "border border-purple-200 p-2 text-center text-purple-700",
    row: "hover:bg-blue-50 transition-colors",
    cell: "border border-purple-200 p-2 text-center",
    editCell: "border border-purple-200 p-1 bg-blue-50",
    editInput: "border border-blue-300 p-1 w-full text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-400",
    actionButtonsContainer: "flex justify-center space-x-2",
    editButton: "text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded transform hover:scale-110 transition-transform",
    saveButton: "text-green-500 hover:text-green-700 bg-green-100 px-2 py-1 rounded transform hover:scale-110 transition-transform",
    cancelButton: "text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded transform hover:scale-110 transition-transform",
    deleteButton: "text-red-500 hover:text-red-700 bg-red-100 px-2 py-1 rounded transform hover:scale-110 transition-transform",
    noRecordsText: "text-gray-500 text-center py-4",
    mobileEditForm: "fixed bottom-0 left-0 right-0 bg-white p-4 rounded-t-lg shadow-lg border-t-2 border-purple-300 z-10",
    mobileEditHeader: "text-lg font-bold text-purple-700 mb-2 text-center",
    mobileEditGrid: "grid grid-cols-1 gap-3",
    mobileEditLabel: "text-sm text-gray-600 font-medium",
    mobileEditActions: "flex justify-between mt-4"
  };

  return (
    <div className={styles.container} style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <h1 className={styles.header}>勤怠記録</h1>
      
      {/* 現在時刻表示 */}
      <div className={styles.timeDisplay}>
        {currentTime.toLocaleString('ja-JP')}
      </div>
      
      {/* 打刻ボタン */}
      <div className={styles.buttonsContainer}>
        {!isWorking ? (
          <button 
            onClick={handleStart} 
            className={styles.startButton}
          >
            勤務開始
          </button>
        ) : (
          <div className="flex flex-col items-center w-full">
            <p className={styles.workingText}>勤務中 - 開始: {formatTime(startTime)}</p>
            <button 
              onClick={handleEnd} 
              className={styles.endButton}
            >
              勤務終了
            </button>
          </div>
        )}
      </div>
      
      {/* 記録一覧 */}
      <div className={styles.recordsContainer}>
        <div className={styles.recordsHeader}>
          <h2 className={styles.recordsTitle}>勤怠記録</h2>
          <button 
            onClick={exportCSV} 
            className={styles.exportButton}
            disabled={records.length === 0}
          >
            CSVエクスポート
          </button>
        </div>
        
        {records.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.headerCell}>日付</th>
                  <th className={styles.headerCell}>開始</th>
                  <th className={styles.headerCell}>終了</th>
                  <th className={styles.headerCell}>時間</th>
                  <th className={styles.headerCell}>操作</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map(record => (
                  <tr key={record.id} className={styles.row} id={`edit-row-${record.id}`}>
                    {editingRecord && editingRecord.id === record.id && !isMobile ? (
                      // デスクトップ編集モード
                      <>
                        <td className={styles.editCell}>
                          <input
                            type="date"
                            className={styles.editInput}
                            value={editingRecord.dateInput}
                            onChange={(e) => setEditingRecord({...editingRecord, dateInput: e.target.value})}
                          />
                        </td>
                        <td className={styles.editCell}>
                          <input
                            type="time"
                            className={styles.editInput}
                            value={editingRecord.startTimeInput}
                            onChange={(e) => setEditingRecord({...editingRecord, startTimeInput: e.target.value})}
                            step="1"
                          />
                        </td>
                        <td className={styles.editCell}>
                          <input
                            type="time"
                            className={styles.editInput}
                            value={editingRecord.endTimeInput}
                            onChange={(e) => setEditingRecord({...editingRecord, endTimeInput: e.target.value})}
                            step="1"
                          />
                        </td>
                        <td className={styles.cell}>{record.duration}</td>
                        <td className={styles.editCell}>
                          <div className={styles.actionButtonsContainer}>
                            <button
                              onClick={handleSaveEdit}
                              className={styles.saveButton}
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className={styles.cancelButton}
                            >
                              キャンセル
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // 表示モード
                      <>
                        <td className={styles.cell}>{record.date}</td>
                        <td className={styles.cell}>{record.startTime}</td>
                        <td className={styles.cell}>{record.endTime}</td>
                        <td className={styles.cell}>{record.duration}</td>
                        <td className={styles.cell}>
                          <div className={styles.actionButtonsContainer}>
                            <button 
                              onClick={() => handleEdit(record)}
                              className={styles.editButton}
                            >
                              編集
                            </button>
                            <button 
                              onClick={() => handleDelete(record.id)}
                              className={styles.deleteButton}
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
        ) : (
          <p className={styles.noRecordsText}>記録がありません</p>
        )}
      </div>
      
      {/* モバイル用の編集フォーム */}
      {isMobile && editingRecord && (
        <div className={styles.mobileEditForm}>
          <h3 className={styles.mobileEditHeader}>勤怠記録を編集</h3>
          <div className={styles.mobileEditGrid}>
            <div>
              <label className={styles.mobileEditLabel}>日付</label>
              <input
                type="date"
                className={styles.editInput}
                value={editingRecord.dateInput}
                onChange={(e) => setEditingRecord({...editingRecord, dateInput: e.target.value})}
              />
            </div>
            <div>
              <label className={styles.mobileEditLabel}>開始時間</label>
              <input
                type="time"
                className={styles.editInput}
                value={editingRecord.startTimeInput}
                onChange={(e) => setEditingRecord({...editingRecord, startTimeInput: e.target.value})}
                step="1"
              />
            </div>
            <div>
              <label className={styles.mobileEditLabel}>終了時間</label>
              <input
                type="time"
                className={styles.editInput}
                value={editingRecord.endTimeInput}
                onChange={(e) => setEditingRecord({...editingRecord, endTimeInput: e.target.value})}
                step="1"
              />
            </div>
          </div>
          <div className={styles.mobileEditActions}>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg w-5/12"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 px-4 rounded-lg w-5/12"
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