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
  };
  
  // レコード編集
  const [editingRecord, setEditingRecord] = useState(null);
  
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

  return (
    <div className="flex flex-col items-center p-4 max-w-3xl mx-auto h-full" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <h1 className="text-2xl font-bold mb-4">シンプル勤怠記録</h1>
      
      {/* 現在時刻表示 */}
      <div className="text-xl mb-4 text-center">
        {currentTime.toLocaleString('ja-JP')}
      </div>
      
      {/* 打刻ボタン */}
      <div className="mb-6 w-full flex justify-center">
        {!isWorking ? (
          <button 
            onClick={handleStart} 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg w-full max-w-xs"
          >
            勤務開始
          </button>
        ) : (
          <div className="flex flex-col items-center w-full">
            <p className="mb-2">勤務中 - 開始: {formatTime(startTime)}</p>
            <button 
              onClick={handleEnd} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg w-full max-w-xs"
            >
              勤務終了
            </button>
          </div>
        )}
      </div>
      
      {/* 記録一覧 */}
      <div className="w-full">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">勤怠記録</h2>
          <button 
            onClick={exportCSV} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={records.length === 0}
          >
            CSVエクスポート
          </button>
        </div>
        
        {records.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-left">日付</th>
                  <th className="border p-1 text-left">開始</th>
                  <th className="border p-1 text-left">終了</th>
                  <th className="border p-1 text-left">時間</th>
                  <th className="border p-1 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map(record => (
                  <tr key={record.id}>
                    {editingRecord && editingRecord.id === record.id ? (
                      // 編集モード
                      <>
                        <td className="border p-1">
                          <input
                            type="date"
                            className="border p-1 w-full text-xs"
                            value={editingRecord.dateInput}
                            onChange={(e) => setEditingRecord({...editingRecord, dateInput: e.target.value})}
                          />
                        </td>
                        <td className="border p-1">
                          <input
                            type="time"
                            className="border p-1 w-full text-xs"
                            value={editingRecord.startTimeInput}
                            onChange={(e) => setEditingRecord({...editingRecord, startTimeInput: e.target.value})}
                            step="1"
                          />
                        </td>
                        <td className="border p-1">
                          <input
                            type="time"
                            className="border p-1 w-full text-xs"
                            value={editingRecord.endTimeInput}
                            onChange={(e) => setEditingRecord({...editingRecord, endTimeInput: e.target.value})}
                            step="1"
                          />
                        </td>
                        <td className="border p-1">{record.duration}</td>
                        <td className="border p-1 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-500 hover:text-green-700"
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              キャンセル
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // 表示モード
                      <>
                        <td className="border p-1">{record.date}</td>
                        <td className="border p-1">{record.startTime}</td>
                        <td className="border p-1">{record.endTime}</td>
                        <td className="border p-1">{record.duration}</td>
                        <td className="border p-1 text-center">
                          <div className="flex justify-center space-x-2">
                            <button 
                              onClick={() => handleEdit(record)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              編集
                            </button>
                            <button 
                              onClick={() => handleDelete(record.id)}
                              className="text-red-500 hover:text-red-700"
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
          <p className="text-gray-500 text-center py-4">記録がありません</p>
        )}
      </div>
    </div>
  );
};

export default TimeRecorderApp;
