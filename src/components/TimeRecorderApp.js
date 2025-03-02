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
    container: "flex flex-col items-center p-4 max-w-3xl mx-auto min-h-screen",
    header: "text-2xl font-bold mb-4 text-center",
    timeDisplay: "text-xl mb-4 text-center",
    buttonsContainer: "mb-6 w-full flex justify-center",
    startButton: "bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg w-full max-w-xs",
    endButton: "bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg w-full max-w-xs",
    workingText: "mb-2 text-center",
    recordsTitle: "text-xl font-semibold",
    exportButton: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded",
    tableContainer: "overflow-x-auto w-full",
    table: "w-full border-collapse text-sm",
    tableHeader: "bg-gray-100",
    headerCell: "border p-1 text-center",
    cell: "border p-1 text-center",
    editInput: "border p-1 w-full text-xs",
    actionButtonsContainer: "flex justify-center space-x-2",
    editButton: "text-blue-500 hover:text-blue-700",
    saveButton: "text-green-500 hover:text-green-700",
    cancelButton: "text-gray-500 hover:text-gray-700",
    deleteButton: "text-red-500 hover:text-red-700",
    noRecordsText: "text-gray-500 text-center py-4"
  };

  return (
    <div className={styles.container} style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <h1 className={styles.header}>シンプル勤怠記録</h1>
      
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
      <div className="w-full">
        <div className="flex justify-between mb-4">
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
                  <tr key={record.id}>
                    {editingRecord && editingRecord.id === record.id ? (
                      // 編集モード
                      <>
                        <td className={styles.cell}>
                          <input
                            type="date"
                            className={styles.editInput}
                            value={editingRecord.dateInput}
                            onChange={(e) => setEditingRecord({...editingRecord, dateInput: e.target.value})}
                          />
                        </td>
                        <td className={styles.cell}>
                          <input
                            type="time"
                            className={styles.editInput}
                            value={editingRecord.startTimeInput}
                            onChange={(e) => setEditingRecord({...editingRecord, startTimeInput: e.target.value})}
                            step="1"
                          />
                        </td>
                        <td className={styles.cell}>
                          <input
                            type="time"
                            className={styles.editInput}
                            value={editingRecord.endTimeInput}
                            onChange={(e) => setEditingRecord({...editingRecord, endTimeInput: e.target.value})}
                            step="1"
                          />
                        </td>
                        <td className={styles.cell}>{record.duration}</td>
                        <td className={styles.cell}>
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
    </div>
  );
};

export default TimeRecorderApp;