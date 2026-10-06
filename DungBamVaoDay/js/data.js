/* School project: Em làm chủ AI. All situations are learning examples. */
window.CASES = [
  {
    "title": "Chọn trường có cần xem thêm thông tin?",
    "context": "Võ Khải thích Sinh học và muốn đi học gần nhà. Bạn đang so sánh trường A với trường B, nhưng mới biết trường B có điểm chuẩn cao hơn.",
    "question": "Điểm chuẩn cao hơn có đủ để Võ Khải chọn trường B không?",
    "answer": "Chưa đủ. Võ Khải nên xem thêm môn học, câu lạc bộ và thời gian đi lại.",
    "verdict": "Võ Khải cần thêm thông tin trước khi chọn trường.",
    "records": [
      {
        "label": "Thông tin về hai trường",
        "text": "Trong ví dụ, trường A cách nhà 20 phút và có câu lạc bộ Sinh học. Trường B có điểm chuẩn cao hơn, nhưng chưa rõ câu lạc bộ và đường đi."
      },
      {
        "label": "Điều Võ Khải quan tâm",
        "text": "Võ Khải muốn học Sinh học, tham gia hoạt động tìm hiểu sinh học và có thời gian tự học."
      }
    ],
    "proof": "Điểm chuẩn chỉ là một yếu tố. Trường A có hoạt động Võ Khải thích; thông tin về trường B còn thiếu nên chưa thể so sánh đầy đủ.",
    "method": "Em ghi các điều Võ Khải cần, đối chiếu thông tin của hai trường và đánh dấu phần còn thiếu. Với trường thật, em xem thông báo chính thức hoặc hỏi nhà trường.",
    "better": "Võ Khải chưa nên chọn chỉ vì điểm chuẩn cao. Bạn cần tìm hiểu thêm trường B rồi so sánh với sở thích và việc đi lại của mình.",
    "support": "AI gợi ý những điều cần so sánh khi chọn trường.",
    "studentWork": "Người học xác định nhu cầu của mình, tìm thông tin và tự quyết định.",
    "lesson": "Em chọn dựa vào nhu cầu và thông tin đầy đủ, không chỉ một con số.",
    "color": "var(--yellow)"
  },
  {
    "title": "26 điểm đã chắc chắn trúng tuyển chưa?",
    "context": "Kiên được 26 điểm. Điểm chuẩn năm trước của trường A là 24,5 nên bạn nghĩ mình chắc chắn trúng tuyển.",
    "question": "Kiên có thể kết luận như vậy chỉ từ điểm chuẩn năm trước không?",
    "answer": "Chưa thể. Điểm chuẩn năm trước chỉ để tham khảo; Kiên cần chờ kết quả của năm nay.",
    "verdict": "Điểm chuẩn cũ chưa đủ để kết luận.",
    "records": [
      {
        "label": "Năm trước trong ví dụ",
        "text": "Trường A lấy 24,5 điểm và tuyển 400 học sinh."
      },
      {
        "label": "Năm nay trong ví dụ",
        "text": "Trường A tuyển 300 học sinh. Điểm chuẩn và danh sách trúng tuyển chưa được công bố."
      }
    ],
    "proof": "Chỉ tiêu đã giảm từ 400 xuống 300. Điểm chuẩn có thể thay đổi nên mốc 24,5 của năm trước không bảo đảm kết quả năm nay.",
    "method": "Em so sánh thông tin của hai năm. Khi tìm hiểu tuyển sinh thật, em kiểm tra năm áp dụng, cách tính điểm và thông báo chính thức.",
    "better": "26 điểm cao hơn điểm chuẩn năm trước, nhưng Kiên vẫn cần chờ điểm chuẩn và danh sách trúng tuyển năm nay.",
    "support": "AI giúp phân biệt thông tin tham khảo với kết quả chính thức.",
    "studentWork": "Người học đọc thông báo đúng năm và kiểm tra điều kiện tuyển sinh.",
    "lesson": "Em xem thời điểm áp dụng trước khi dùng một thông tin.",
    "color": "var(--yellow)"
  },
  {
    "title": "Nhóm ôn tập nào có đủ hai môn Triết muốn ôn?",
    "context": "Triết muốn ôn cả Vật lí và Toán. Trong ví dụ, trường A tổ chức hai nhóm ôn tập với các môn khác nhau.",
    "question": "Cả hai nhóm có đủ hai môn Triết muốn ôn không?",
    "answer": "Không. Nhóm 01 có cả Vật lí và Toán; nhóm 02 chỉ có Toán.",
    "verdict": "Nhóm 01 có đủ hai môn Triết muốn ôn.",
    "records": [
      {
        "label": "Danh sách môn trong ví dụ",
        "text": "Nhóm 01: Vật lí, Hóa học, Sinh học, Toán. Nhóm 02: Địa lí, Giáo dục kinh tế và pháp luật, Công nghệ, Toán."
      },
      {
        "label": "Mong muốn của Triết",
        "text": "Triết muốn ôn cả Vật lí và Toán."
      }
    ],
    "proof": "Đối chiếu hai danh sách cho thấy nhóm 02 không có Vật lí. Nhóm 01 có đủ hai môn Triết quan tâm.",
    "method": "Em dò từng môn Triết muốn ôn trong mỗi nhóm. Nếu tham gia nhóm thật, em xem danh sách môn, lịch học và hỏi rõ cách đăng kí.",
    "better": "Trong ví dụ này, nhóm 01 có cả Vật lí và Toán. Triết cần xem thêm lịch ôn tập trước khi đăng kí.",
    "support": "AI hỗ trợ đọc và so sánh danh sách môn.",
    "studentWork": "Người học đối chiếu từng môn, xem lịch ôn tập và tự chọn nhóm phù hợp.",
    "lesson": "Em đọc danh sách cụ thể thay vì chỉ nhìn tên nhóm.",
    "color": "var(--coral)"
  },
  {
    "title": "Ảnh báo nghỉ học có còn đúng không?",
    "context": "Nhóm lớp chia sẻ ảnh ghi “12/10 nghỉ học”. Ảnh bị cắt mất năm và nơi đăng thông báo.",
    "question": "Chỉ từ ảnh này, em đã biết lịch học năm nay chưa?",
    "answer": "Chưa. Em cần xem ảnh đầy đủ và đối chiếu thông báo của cô hoặc nhà trường.",
    "verdict": "Ảnh cũ không cho biết lịch học năm nay.",
    "records": [
      {
        "label": "Ảnh đầy đủ trong ví dụ",
        "text": "Ảnh ghi nghỉ ngày 12/10/2025. Phần ghi năm bị cắt khỏi ảnh được chia sẻ."
      },
      {
        "label": "Thông báo mới trong ví dụ",
        "text": "Cô thông báo: ngày 12/10/2026, lớp học theo thời khóa biểu."
      }
    ],
    "proof": "Hai thông báo nói về hai năm khác nhau. Theo thông báo mới trong ví dụ, lớp vẫn học ngày 12/10/2026.",
    "method": "Em xem đủ ngày, năm, lớp áp dụng và người đăng. Nếu chưa rõ lịch học thật, em hỏi cô hoặc xem thông báo của trường trước khi chia sẻ.",
    "better": "Trong ví dụ, lớp vẫn học ngày 12/10/2026. Không dùng ảnh năm 2025 để kết luận lịch năm nay.",
    "support": "AI nhắc những chi tiết cần kiểm tra trong một thông báo.",
    "studentWork": "Người học tìm thông báo gốc và xác nhận lịch với cô hoặc nhà trường.",
    "lesson": "Em kiểm tra ngày và nguồn trước khi tin hoặc chia sẻ.",
    "color": "var(--mint)"
  },
  {
    "title": "Lời giải của AI đã đủ nghiệm chưa?",
    "context": "Nguyên nhờ AI giải phương trình x² = 9 khi ôn Toán lớp 9.",
    "question": "AI chỉ đưa ra x = 3. Lời giải này đã đầy đủ chưa?",
    "answer": "Đã đủ. Vì 3² = 9 nên phương trình chỉ có nghiệm x = 3.",
    "verdict": "AI bỏ sót nghiệm x = −3.",
    "records": [
      {
        "label": "Yêu cầu của bài toán",
        "text": "Tìm tất cả nghiệm của x² = 9. Đề không yêu cầu x phải dương."
      },
      {
        "label": "Thay số để kiểm tra",
        "text": "3² = 9 và (−3)² = 9. Cả hai số đều thỏa mãn phương trình."
      }
    ],
    "proof": "Từ x² = 9, em được (x − 3)(x + 3) = 0. Vậy x = 3 hoặc x = −3.",
    "method": "Em tự giải, thay cả hai nghiệm vào phương trình và kiểm tra điều kiện của đề. Nếu chưa hiểu cách giải, em xem sách giáo khoa hoặc hỏi thầy cô.",
    "better": "Phương trình x² = 9 có hai nghiệm: x = 3 và x = −3.",
    "support": "AI đưa ra một lời giải để người học tham khảo.",
    "studentWork": "Người học tự tính, kiểm tra đủ nghiệm và giải thích từng bước.",
    "lesson": "Em kiểm tra cả tính đúng và tính đầy đủ của lời giải.",
    "color": "var(--coral)"
  },
  {
    "title": "Lịch ôn bài có vừa 60 phút không?",
    "context": "Khang có thời gian từ 19 giờ đến 20 giờ. Bạn nhờ AI chia lịch ôn ba môn và dành 5 phút nghỉ.",
    "question": "Lịch AI gợi ý có đáp ứng đủ yêu cầu của Khang không?",
    "answer": "Có. Học Toán 30 phút, Ngữ văn 30 phút và Tiếng Anh 30 phút là vừa một giờ.",
    "verdict": "Lịch dài 90 phút và chưa có giờ nghỉ.",
    "records": [
      {
        "label": "Thời gian Khang có",
        "text": "Từ 19 giờ đến 20 giờ là 60 phút, gồm 5 phút nghỉ."
      },
      {
        "label": "Thời gian AI gợi ý",
        "text": "30 + 30 + 30 = 90 phút học, chưa tính thời gian nghỉ."
      }
    ],
    "proof": "90 phút đã vượt 60 phút Khang có. Lịch cũng thiếu 5 phút nghỉ nên chưa đáp ứng yêu cầu.",
    "method": "Em cộng tất cả thời gian học và nghỉ, so với 60 phút rồi điều chỉnh. Sau đó em kiểm tra xem mỗi môn có đủ thời gian ôn nội dung cần học không.",
    "better": "Một lịch có thể dùng: Toán 20 phút, Ngữ văn 20 phút, nghỉ 5 phút, Tiếng Anh 15 phút. Tổng cộng 60 phút.",
    "support": "AI gợi ý cách chia lịch ôn bài.",
    "studentWork": "Người học cộng lại thời gian và điều chỉnh theo việc mình cần làm.",
    "lesson": "Em kiểm tra gợi ý có phù hợp với thời gian và yêu cầu của mình không.",
    "color": "var(--coral)"
  },
  {
    "title": "AI có thể giúp đặt tên báo tường không?",
    "context": "Nhóm của Hà làm báo tường ngày 20/11. Các bạn muốn tên không quá 5 từ và thể hiện lòng biết ơn thầy cô.",
    "question": "Nhóm có thể tham khảo tên AI gợi ý rồi tự chọn và chỉnh sửa không?",
    "answer": "Có. Nhóm có thể tham khảo “Nét phấn yêu thương”, rồi cùng chọn và chỉnh theo ý mình.",
    "verdict": "Tên gợi ý đáp ứng yêu cầu trong ví dụ.",
    "records": [
      {
        "label": "Yêu cầu đặt tên",
        "text": "Tên không quá 5 từ, hướng về thầy cô. Nhóm tự chọn tên và thực hiện báo tường."
      },
      {
        "label": "Tên AI gợi ý",
        "text": "“Nét phấn yêu thương” có 4 từ: Nét, phấn, yêu, thương."
      }
    ],
    "proof": "Tên có 4 từ, không vượt giới hạn và phù hợp chủ đề. Đây vẫn là gợi ý; nhóm quyết định tên và cách thể hiện.",
    "method": "Em đếm số từ, đọc lại ý nghĩa và trao đổi với các bạn. Nếu dùng tên gợi ý, nhóm ghi rõ AI đã hỗ trợ đặt tên.",
    "better": "Nhóm có thể chọn tên này hoặc chỉnh lại để phù hợp với ý tưởng của lớp.",
    "support": "AI gợi ý một tên báo tường.",
    "studentWork": "Nhóm tự chọn tên, viết bài, trang trí và ghi rõ phần AI hỗ trợ.",
    "lesson": "Em dùng AI để tìm ý, rồi tự lựa chọn và sáng tạo.",
    "color": "var(--mint)"
  },
  {
    "title": "AI ghi nguồn thì đã đủ để trích dẫn chưa?",
    "context": "Bình nhờ AI tìm một câu trích dẫn cho báo tường. AI ghi nguồn là “một tài liệu của trường” nhưng không đưa bản gốc.",
    "question": "Bình đã có thể dùng câu này như một trích dẫn được kiểm tra chưa?",
    "answer": "Chưa. Bình cần tìm tên tài liệu, tác giả và bản gốc để đối chiếu.",
    "verdict": "Nguồn được ghi còn thiếu thông tin.",
    "records": [
      {
        "label": "Nguồn AI đưa ra",
        "text": "Chỉ có cụm “một tài liệu của trường”, không có tên tài liệu, tác giả hoặc bản gốc."
      },
      {
        "label": "Kết quả tìm trong ví dụ",
        "text": "Bình chưa tìm thấy tài liệu chứa câu trích dẫn."
      }
    ],
    "proof": "Chưa có bản gốc thì chưa xác nhận được câu trích dẫn và ngữ cảnh. Việc chưa tìm thấy nguồn cũng chưa đủ để kết luận câu đó là giả.",
    "method": "Em tìm tên tài liệu, tác giả và bản gốc; đọc đoạn có câu trích rồi so sánh. Nếu chưa xác minh được, em không ghi đó là trích dẫn đã kiểm tra.",
    "better": "Bình nên tìm bản gốc trước. Nếu chưa tìm được, bạn có thể viết ý của mình và không gán câu đó cho một tác giả.",
    "support": "AI hỗ trợ tìm gợi ý về nội dung và nguồn trích dẫn.",
    "studentWork": "Người học mở bản gốc, đối chiếu câu trích và ghi nguồn chính xác.",
    "lesson": "Em kiểm tra nguồn thật, không chỉ tin dòng nguồn do AI viết.",
    "color": "var(--yellow)"
  },
  {
    "title": "Nhờ AI hỗ trợ mà vẫn tự làm bài",
    "context": "Trong ví dụ, cô giao viết đoạn văn về giảm rác trong lớp. Huy muốn dùng AI để tìm ý rồi tự viết bài.",
    "question": "AI giúp ở khâu nào, còn Huy cần tự làm phần nào?",
    "answer": "AI có thể gợi ý dàn ý. Huy cần tự quan sát, viết bài, kiểm tra nội dung và ghi rõ phần AI hỗ trợ.",
    "verdict": "AI hỗ trợ tìm ý; Huy tự thực hiện bài viết.",
    "records": [
      {
        "label": "Yêu cầu trong ví dụ",
        "text": "Được tham khảo dàn ý của AI. Bài cuối thể hiện ý kiến của học sinh và ghi rõ phần AI hỗ trợ."
      },
      {
        "label": "Phần Huy cần tự làm",
        "text": "Quan sát lớp, chọn việc có thể làm để giảm rác, viết đoạn văn và giải thích được các ý trong bài."
      }
    ],
    "proof": "Dàn ý giúp bắt đầu bài viết, nhưng không thay cho quan sát và suy nghĩ của Huy. Những chi tiết đưa vào bài phải đúng với điều bạn biết.",
    "method": "Em so từng ý với quan sát thực tế và yêu cầu của cô. Em bỏ chi tiết không có căn cứ, sửa cách diễn đạt và ghi rõ AI đã giúp phần nào.",
    "better": "Huy có thể tham khảo dàn ý rồi tự viết. Nếu chưa khảo sát, bạn không đưa số liệu tự bịa vào bài.",
    "support": "AI gợi ý dàn ý và hỗ trợ chỉnh cách diễn đạt.",
    "studentWork": "Huy tự quan sát, chọn ý, viết đoạn văn, kiểm tra và trình bày bài.",
    "lesson": "Em hiểu bài mình nộp và chịu trách nhiệm về nội dung.",
    "color": "var(--mint)"
  }
];
window.PROJECT_NOTES = {
  "task": "Em xây dựng một website với 9 tình huống để luyện cách kiểm tra câu trả lời của AI trong học tập.",
  "aiHelp": "AI hỗ trợ chỉnh lời văn, gợi ý cách kiểm tra, sửa mã và hoàn thiện giao diện, minh họa, hiệu ứng.",
  "check": "Đối chiếu với dữ kiện trong từng ví dụ; tự tính lại bài Toán và lịch học. Khi dùng thông tin thật, tìm bản gốc và xem nguồn, thời điểm áp dụng.",
  "student": "Em tự viết nội dung ban đầu và một phần mã web. Em chọn cách trình bày và góp ý các bản sửa.",
  "safety": "Dùng AI để hỗ trợ học tập. Không gửi mật khẩu, địa chỉ, số điện thoại hoặc dữ liệu riêng của người khác. Kiểm tra nội dung và ghi rõ phần AI hỗ trợ.",
  "scope": "Tên trường, nhân vật, thông báo và số liệu tuyển sinh trong 9 tình huống đều là giả định để học cách kiểm tra thông tin.",
  "assignment": "Sản phẩm theo chủ đề Tin học “Em làm chủ AI” của cuộc thi “Sản phẩm số của em”.",
  "inspiration": "Em lấy ý tưởng nội dung từ bài học thực hành môn Tin học."
};
