import { useEffect, useMemo, useState } from 'react';
import { hostelsAPI } from '../services/api';

export default function useHostelNameMap() {
  const [hostels, setHostels] = useState([]);

  useEffect(() => {
    hostelsAPI.getAll()
      .then((res) => setHostels(res.data.hostels || []))
      .catch(() => setHostels([]));
  }, []);

  const hostelNameByBlock = useMemo(() => {
    const map = new Map();
    hostels.forEach((h) => {
      if (h?.block_code) map.set(String(h.block_code), h.name || `Hostel ${h.block_code}`);
    });
    return map;
  }, [hostels]);

  const getHostelName = (blockCode) => {
    if (!blockCode) return '-';
    return hostelNameByBlock.get(String(blockCode)) || `Hostel ${blockCode}`;
  };

  return { hostels, hostelNameByBlock, getHostelName };
}

