const CBR_DATA = {
  // Bible book names and their total number of chapters
  bibleBooks: [
    { name: "Genesis", chapters: 50 },
    { name: "Exodus", chapters: 40 },
    { name: "Leviticus", chapters: 27 },
    { name: "Numbers", chapters: 36 },
    { name: "Deuteronomy", chapters: 34 },
    { name: "Joshua", chapters: 24 },
    { name: "Judges", chapters: 21 },
    { name: "Ruth", chapters: 4 },
    { name: "1 Samuel", chapters: 31 },
    { name: "2 Samuel", chapters: 24 },
    { name: "1 Kings", chapters: 22 },
    { name: "2 Kings", chapters: 25 },
    { name: "1 Chronicles", chapters: 29 },
    { name: "2 Chronicles", chapters: 36 },
    { name: "Ezra", chapters: 10 },
    { name: "Nehemiah", chapters: 13 },
    { name: "Esther", chapters: 10 },
    { name: "Job", chapters: 42 },
    { name: "Psalms", chapters: 150 },
    { name: "Proverbs", chapters: 31 },
    { name: "Ecclesiastes", chapters: 12 },
    { name: "Song of Solomon", chapters: 8 },
    { name: "Isaiah", chapters: 66 },
    { name: "Jeremiah", chapters: 52 },
    { name: "Lamentations", chapters: 5 },
    { name: "Ezekiel", chapters: 48 },
    { name: "Daniel", chapters: 12 },
    { name: "Hosea", chapters: 14 },
    { name: "Joel", chapters: 3 },
    { name: "Amos", chapters: 9 },
    { name: "Obadiah", chapters: 1 },
    { name: "Jonah", chapters: 4 },
    { name: "Micah", chapters: 7 },
    { name: "Nahum", chapters: 3 },
    { name: "Habakkuk", chapters: 3 },
    { name: "Zephaniah", chapters: 3 },
    { name: "Haggai", chapters: 2 },
    { name: "Zechariah", chapters: 14 },
    { name: "Malachi", chapters: 4 },
    { name: "Matthew", chapters: 28 },
    { name: "Mark", chapters: 16 },
    { name: "Luke", chapters: 24 },
    { name: "John", chapters: 21 },
    { name: "Acts", chapters: 28 },
    { name: "Romans", chapters: 16 },
    { name: "1 Corinthians", chapters: 16 },
    { name: "2 Corinthians", chapters: 13 },
    { name: "Galatians", chapters: 6 },
    { name: "Ephesians", chapters: 6 },
    { name: "Philippians", chapters: 4 },
    { name: "Colossians", chapters: 4 },
    { name: "1 Thessalonians", chapters: 5 },
    { name: "2 Thessalonians", chapters: 3 },
    { name: "1 Timothy", chapters: 6 },
    { name: "2 Timothy", chapters: 4 },
    { name: "Titus", chapters: 3 },
    { name: "Philemon", chapters: 1 },
    { name: "Hebrews", chapters: 13 },
    { name: "James", chapters: 5 },
    { name: "1 Peter", chapters: 5 },
    { name: "2 Peter", chapters: 3 },
    { name: "1 John", chapters: 5 },
    { name: "2 John", chapters: 1 },
    { name: "3 John", chapters: 1 },
    { name: "Jude", chapters: 1 },
    { name: "Revelation", chapters: 22 }
  ],

  // 36 session activities, grouped by Session (representing Card 1-7)
  sessions: [
    {
      cardIndex: 0,
      title: "Session 1 (Card 1)",
      activities: [
        { id: 1, text: "Read carefully all the information and instructions in the CBR manual." },
        { id: 2, text: "Start using New FID during meditation and journaling in CBR." },
        { id: 3, text: "Memorize and Pray back Heb 12:11 and 1 Tim 4:15-16." },
        { id: 4, text: "Start Evaluating your Weekly Growth points on Challenger CARD." },
        { id: 5, text: "Discuss Lesson 1 and Study Questions with PE (see Questions Card)." },
        { id: 6, text: "Start Identifying and displaying your Consistency Barriers (CBs)." }
      ]
    },
    {
      cardIndex: 1,
      title: "Session 2 (Card 2)",
      activities: [
        { id: 7, text: "Read and Finish The Power In CBR Discipline (PDF)." },
        { id: 8, text: "Use the OPEN Method to study Gal. 6:6-10 (page 6)." },
        { id: 9, text: "Memorize and pray back Gal. 6:6-10." },
        { id: 10, text: "Start forming principles against CBs and redeeming lost Growth Points." },
        { id: 11, text: "Discuss Lesson 2 and Study Questions with PEs." }
      ]
    },
    {
      cardIndex: 2,
      title: "Session 3 (Card 3)",
      activities: [
        { id: 12, text: "Use the OPEN Method to study 2 Cor 9:6-15 (page 6)." },
        { id: 13, text: "Read and Finish the book Train Yourself to be Godly." },
        { id: 14, text: "Analyze and start changing your Character during CBR (page 3)." },
        { id: 15, text: "Memorize and Pray back 1 Cor 9:24-27 and 1 Tim 4:7-8." },
        { id: 16, text: "Discuss Lesson 3 and Study Questions." }
      ]
    },
    {
      cardIndex: 3,
      title: "Session 4 (Card 4)",
      activities: [
        { id: 17, text: "Use the PERSONS method to study Perseverance (page 7)." },
        { id: 18, text: "Use the PERSONS method to study Diligence (Page 7)." },
        { id: 19, text: "List all course memory Scriptures (do at least 7 recitations by end of training)." },
        { id: 20, text: "Memorize James 1:25 & Heb 4:12." },
        { id: 21, text: "Discuss Lesson 4 and Study Questions." }
      ]
    },
    {
      cardIndex: 4,
      title: "Session 5 (Card 5)",
      activities: [
        { id: 22, text: "Use the PERSONS method to study a some Faithfulness (page 7)." },
        { id: 23, text: "Memorise the definition of CBR (see Reference Card)." },
        { id: 24, text: "Write down practical principles against the listed CBs." },
        { id: 25, text: "Memorize and pray back Jos 1:8 and Rev 1:3." },
        { id: 26, text: "Discuss Lesson 5 and Study Questions." }
      ]
    },
    {
      cardIndex: 5,
      title: "Session 6 (Card 6)",
      activities: [
        { id: 27, text: "Complete analysis of Character Transformation through CBR (page 3)." },
        { id: 28, text: "Pray back the entire Psalm 119 (page 5)." },
        { id: 29, text: "Use PERSONS method to study Accountability (page 7)." },
        { id: 30, text: "Memorize and pray back Psalm 1:1-6." },
        { id: 31, text: "Discuss Lesson 6 and Study Questions." }
      ]
    },
    {
      cardIndex: 6,
      title: "Session 7 (Card 7)",
      activities: [
        { id: 32, text: "Complete at least 7 recitations of your listed course Scriptures." },
        { id: 33, text: "Memorize and pray back Deut 6:6-9." },
        { id: 34, text: "Planning Church Presentation and Commissioning Details." },
        { id: 35, text: "Discuss Lesson 7 and Study Questions." },
        { id: 36, text: "I have decided to PARTNER in extending CBR." }
      ]
    }
  ],

  // 20 Consistency Barriers (CBs) split into Personal and External
  barriers: [
    { id: 1, type: "Personal", text: "When suffering discouragement" },
    { id: 2, type: "Personal", text: "When struggling to understand Scripture" },
    { id: 3, type: "Personal", text: "When feeling excessively sleepy" },
    { id: 4, type: "Personal", text: "When you're too busy" },
    { id: 5, type: "Personal", text: "When feeling too fatigued" },
    { id: 6, type: "Personal", text: "When you're sick or sickly" },
    { id: 7, type: "Personal", text: "When tempted to sleep a bit" },
    { id: 8, type: "Personal", text: "When feeling disorganized" },
    { id: 9, type: "Personal", text: "When undergoing marital conflicts" },
    { id: 10, type: "Personal", text: "When you cannot concentrate" },
    { id: 11, type: "External", text: "When you have many visitors" },
    { id: 12, type: "External", text: "When babies need attention" },
    { id: 13, type: "External", text: "When out visiting friends" },
    { id: 14, type: "External", text: "When you are on holiday" },
    { id: 15, type: "External", text: "When on night duty" },
    { id: 16, type: "External", text: "When the alarm fails" },
    { id: 17, type: "External", text: "When there is no light" },
    { id: 18, type: "External", text: "When the environment is noisy" },
    { id: 19, type: "External", text: "When there is bad weather" },
    { id: 20, type: "External", text: "When under work pressure" }
  ],

  // Study Questions for Lesson 1 to 7
  lessons: [
    {
      lessonIndex: 1,
      title: "Lesson 1: Value of Consistency",
      questions: [
        "In which areas of life have you succeeded simply because you were required to be consistent, whether willingly or unwillingly? How would your life be now if you had not strived to be consistent here?",
        "Why does God demand consistency as seen in the following Scriptures? (Deut 17:18-20; Jos 1:8; James 1:2-5)",
        "What price does God expect you to pay to develop discipline in Bible reading? (Heb 12:11; 1 Cor 9:27)",
        "Which words are used in the following Scriptures to encourage us to avoid laxity in developing CBR discipline? (2 Chron 16:9; Col 3:23-24; James 4:17 and Jer 48:10)"
      ]
    },
    {
      lessonIndex: 2,
      title: "Lesson 2: Overcoming Consistency Barriers",
      questions: [
        "Think of the ways Satan tempted Job to denounce God in Job 1. How does this revelation help us to understand the demonic nature of Consistency Barriers? Why does Satan put so much effort into making CBs against brethren? (Eph 6:17, Heb 4:12)",
        "What is the significance of each of the four steps in overcoming a Consistency Barrier?",
        "Explain keenly how obeying the instructions in 1 Tim 4:15-16 could help one overcome many CBs permanently.",
        "Why is perseverance the key quality to be developed by one who wants to become a Bible reader for life?"
      ]
    },
    {
      lessonIndex: 3,
      title: "Lesson 3: The Power of Groups (PEGs)",
      questions: [
        "Read Gen 11:1-10, Mat 18:18-20, Eccl 4:9-12 and Heb 10:23-25 to see the power in working in groups. What benefits are given for working in groups in each of the Scriptures? With this in mind, why is it vital for you to commit yourself to staying in this CBR class?",
        "Compare physical and spiritual training as illustrated in 1 Cor 9:24-27. What specific principles in the sports world are applicable in doing godly training, such as CBR?",
        "Write down at least five specific things God would expect you to do to ensure that every member of your group completes this CBR course successfully."
      ]
    },
    {
      lessonIndex: 4,
      title: "Lesson 4: Meditation and Hidden Word",
      questions: [
        "What does God expect you to do to discover the Hidden Word or insights from Scripture? (2 Tim 2:7, Psa 119:99-100). What purpose does the Hidden Word serve for a believer? (John 8:32) What is the connection between the Written Word and the Hidden Word?",
        "What reasons are provided in Scripture for meditating on God’s Word? (Jos 1:8, Psa 1:1-3, 2 Tim 2:7)",
        "Provide scriptural backing on when one should engage in meditation as a spiritual exercise.",
        "Christ died as predicted by the Scriptures in Rom 15:8, 1 Cor 15:3-4 and Jn 2:22. Similarly, what will it cost you to know the written Word and the Hidden Word from God? How does this compare to the parables in Matt 13:44-46?"
      ]
    },
    {
      lessonIndex: 5,
      title: "Lesson 5: Reacting to God's Word",
      questions: [
        "What role does the Holy Spirit play during the process of meditation? (1 Cor 2:10-12, Eph 1:17, Jn 14:26)",
        "How did King Josiah react emotionally and rationally when he understood the meaning and implications of the Word that had been read to him? (2 Ki 22 & 23)",
        "Give two main reasons why reaction is a must once an insight has reached the heart. (Heb 4:12, Psa 42:1-3)",
        "Share with your PEs a few situations when you reacted emotionally after reading God’s Word and a few others when you reacted rationally."
      ]
    },
    {
      lessonIndex: 6,
      title: "Lesson 6: Character and Disciplines",
      questions: [
        "Identify the most important things a believer stands to gain by reading and practicing God’s Word from the following Scriptures: Prov 2:1-6, Mat 7:24-27, Heb 5:11-14, and James 1:22-25. How does this truth help you to appreciate the devil’s opposition to CBR?",
        "Developing the CBR discipline is significantly influenced by the following key factors: God, Satan and character.\n  i. Show from the Scriptures how these factors affect Bible-reading endeavours?\n  ii. How would you help believers overcome the challenges posed by these factors?\n  iii. Who is to blame for lack of character in our lives? (1 Tim 4:7, 12)\n  iv. In light of your new insights, how can you assist the church in developing the culture of CBR today?"
      ]
    },
    {
      lessonIndex: 7,
      title: "Lesson 7: Partnering & Mission",
      questions: [
        "Think of the four ladies who, in gratitude, worked with their own hands to support Jesus’ earthly ministry. (Lk 8:1-3)\n  i. Do you believe the assistance they had received was worthy of their dedication?\n  ii. Would you have considered it a privilege to support the Son of God on earth on Father’s behalf?\n  iii. Similarly, would you consider God’s mission of empowering believers with the discipline of reading the Bible Daily & Systematically through the CBR ministry worthy of your support? Why?",
        "Think of the ten reasons why graduate Bible readers ought to support the CBR mission.\n  i. Which three reasons are the most compelling to you?\n  ii. Would you recommend Bible readers to join the CBR support group?\n  iii. How do you personally want to respond to this call?",
        "How much sacrifice does it cost to make one person become a Bible reader? Think of what others have done for you. Would you like to do something about it in response to Christ’s advice in Mat 10:8 (freely you have received, freely give)?"
      ]
    }
  ],

  // The 7 Card levels, their target chapters and target Waking Times (ERT)
  cards: [
    { cardId: 1, chaptersTarget: 1, ertTarget: "05:45", description: "Card 1: 1 Chapter, Target Waking Time: 5:45 AM" },
    { cardId: 2, chaptersTarget: 2, ertTarget: "05:30", description: "Card 2: 2 Chapters, Target Waking Time: 5:30 AM" },
    { cardId: 3, chaptersTarget: 3, ertTarget: "05:15", description: "Card 3: 3 Chapters, Target Waking Time: 5:15 AM" },
    { cardId: 4, chaptersTarget: 4, ertTarget: "05:00", description: "Card 4: 4 Chapters, Target Waking Time: 5:00 AM" },
    { cardId: 5, chaptersTarget: 5, ertTarget: "04:45", description: "Card 5: 5 Chapters, Target Waking Time: 4:45 AM" },
    { cardId: 6, chaptersTarget: 6, ertTarget: "04:30", description: "Card 6: 6 Chapters, Target Waking Time: 4:30 AM" },
    { cardId: 7, chaptersTarget: 7, ertTarget: "04:00", description: "Card 7: 7 Chapters, Target Waking Time: 4:00 AM" }
  ]
};
