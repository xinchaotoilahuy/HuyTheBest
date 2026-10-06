#!/bin/bash
cd "$(dirname "$0")"
printf '\n=== ÁP DỤNG WEB_CONFIG.txt ===\n\n'
python3 apply_web_config.py
status=$?
printf '\n'
if [ $status -ne 0 ]; then
  echo 'Có lỗi khi áp dụng cấu hình. Hãy xem dòng báo lỗi phía trên.'
else
  echo 'Xong. Bây giờ mở index.html để xem website.'
fi
printf '\nNhấn Enter để đóng cửa sổ này...'
read -r
exit $status
