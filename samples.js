/*
 * Example letters for the "Try an example" row.
 * All names, numbers and references are invented for demonstration.
 * Each sample ships with an English result so the demo works instantly
 * and still works when the AI connection is not available.
 */
window.WHISPER_SAMPLES = [
  {
    id: 'municipal',
    title: 'Municipal final notice',
    hint: 'Unpaid water and electricity',
    text: [
      'HIGHVELD METRO MUNICIPALITY',
      'Revenue Management Unit',
      '',
      'FINAL NOTICE OF ARREARS',
      'Date of notice: 12 October 2026',
      'Account no.: 4410 2287 91',
      'Account holder: THE OCCUPANT / OWNER, ERF 2281',
      '',
      'Total arrears: R 6 482.15',
      'Current charges (October): R 1 284.60',
      'Total due: R 7 766.75',
      '',
      'Notwithstanding previous reminders, you are hereby notified in terms of Section 102 of the Local Government: Municipal Systems Act 32 of 2000 that your account is in arrears. Unless payment of the arrears is received on or before 30 October 2026, electricity and water services may be restricted without further notice and the matter may be handed over for debt collection. A reconnection fee will apply.',
      '',
      'You may apply for a payment arrangement at any Customer Care Centre before the above date. Bring your ID and a recent payslip or proof of income. Do not pay at third-party agents without keeping the receipt.',
      '',
      'Queries: visit a Customer Care Centre or use the toll-free line on your statement. Quote your account number.'
    ].join('\n'),
    result: {
      documentType: 'Final notice for an unpaid municipal account',
      sender: 'Highveld Metro Municipality, Revenue Management Unit',
      headline: 'You owe R7 766.75. Act by 30 October 2026 or your water and electricity may be restricted.',
      summary: 'The municipality says your account is behind by R6 482.15. Your October charges of R1 284.60 are on top of that. If they do not receive the arrears by 30 October 2026, they may restrict your services and send the debt to collectors. You would then also pay a reconnection fee. You can ask for a payment plan before that date.',
      urgency: 'now',
      urgencyLabel: 'Act within 14 days',
      deadline: '2026-10-30',
      keyFacts: [
        { label: 'Total due', value: 'R 7 766.75' },
        { label: 'Arrears (late amount)', value: 'R 6 482.15' },
        { label: 'Deadline', value: '30 October 2026' },
        { label: 'Account number', value: '4410 2287 91' },
        { label: 'Where to go', value: 'Any Customer Care Centre' }
      ],
      steps: [
        { text: 'Find your ID and your latest payslip or other proof of income.', by: '' },
        { text: 'Go to a Customer Care Centre and ask for a payment arrangement.', by: '30 Oct 2026', date: '2026-10-30' },
        { text: 'If you can pay, pay the municipality directly and keep the receipt.', by: '30 Oct 2026', date: '2026-10-30' },
        { text: 'Keep this notice and every receipt in one safe place.', by: '' }
      ],
      watchOut: [
        'Do not ignore this letter. Services can be restricted without another warning.',
        'Keep proof of every payment, especially if you pay through an agent.',
        'If you think the amount is wrong, ask about a query form before the deadline.'
      ],
      bring: ['Your ID', 'Your latest payslip or proof of income', 'This notice'],
      questions: ['What happens if I cannot pay by 30 October?', 'Can I pay a little each month?', 'Is the reconnection fee fixed?'],
      scamRisk: 'low',
      scamNote: 'This looks like a normal municipal notice. It names a law and a deadline and asks you to visit a service centre. It does not ask for a PIN or a link click. Still, check the account number against your latest statement.',
      glossary: [
        { term: 'Arrears', meaning: 'Money you still owe from earlier months.' },
        { term: 'Payment arrangement', meaning: 'An agreement to pay what you owe in smaller amounts over time.' },
        { term: 'Restricted', meaning: 'Slowed down or cut off, for example less water.' },
        { term: 'Debt collection', meaning: 'A company is hired to chase you for the money.' }
      ],
      ui: {}
    }
  },
  {
    id: 'grant',
    title: 'Grant review notice',
    hint: 'Child support grant',
    text: [
      'SOCIAL GRANTS OFFICE — REGIONAL OFFICE',
      'NOTICE OF GRANT REVIEW',
      'Date: 5 October 2026',
      'Reference: GR/2026/118342',
      'Grant type: Child Support Grant (1 child)',
      '',
      'Dear beneficiary,',
      '',
      'In terms of the Social Assistance Act, your grant is due for its yearly review. You must appear in person at your nearest local office with the following documents:',
      '(1) your green barcoded ID or smart ID card;',
      '(2) the child\'s birth certificate;',
      '(3) proof of residence not older than 3 months;',
      '(4) the last 3 months\' bank statements or an affidavit stating that you have no income.',
      '',
      'Failure to appear on or before 15 November 2026 will result in the suspension of payments from December 2026. Reviews are done Monday to Friday, 08:00 to 15:00.',
      '',
      'Do not pay anyone to help you with this process. The service is free.'
    ].join('\n'),
    result: {
      documentType: 'Notice that your grant must be reviewed',
      sender: 'Social Grants Office, Regional Office',
      headline: 'Go to your local grants office with your documents before 15 November 2026 to keep getting the grant.',
      summary: 'Your child support grant has its yearly review. You must go to the office in person. If you do not go by 15 November 2026, your payments will stop from December. The review is free and you do not need to pay anyone to help you.',
      urgency: 'soon',
      urgencyLabel: 'Act within 30 days',
      deadline: '2026-11-15',
      keyFacts: [
        { label: 'Go before', value: '15 November 2026' },
        { label: 'Payments stop', value: 'December 2026 if you do not go' },
        { label: 'Office hours', value: 'Monday to Friday, 08:00 to 15:00' },
        { label: 'Reference', value: 'GR/2026/118342' },
        { label: 'Cost', value: 'Free' }
      ],
      steps: [
        { text: 'Collect your ID, the child\'s birth certificate and proof of residence from the last 3 months.', by: '' },
        { text: 'Get your last 3 months of bank statements, or an affidavit if you have no income.', by: '' },
        { text: 'Go to your nearest local office on a weekday between 08:00 and 15:00.', by: '15 Nov 2026', date: '2026-11-15' },
        { text: 'Keep any slip or reference they give you.', by: '' }
      ],
      watchOut: [
        'Never pay anyone to help with the review. The letter says it is free.',
        'Go early in the day. Offices can have long queues.',
        'The letter does not say which office to visit. Use the one nearest to you.'
      ],
      bring: ['Your ID', 'Child\'s birth certificate', 'Proof of residence (last 3 months)', 'Bank statements (last 3 months) or an affidavit'],
      questions: ['Will I lose the grant if I am late?', 'What if I have no bank statements?', 'Can someone go for me?'],
      scamRisk: 'low',
      scamNote: 'This looks like a normal review notice. It asks you to visit an office and warns you not to pay anyone. It does not ask for a PIN or a link.',
      glossary: [
        { term: 'Beneficiary', meaning: 'The person who receives the grant.' },
        { term: 'Suspension', meaning: 'Payments are paused until you sort it out.' },
        { term: 'Affidavit', meaning: 'A written statement you sign in front of an official, such as at a police station.' },
        { term: 'Proof of residence', meaning: 'A paper that shows where you live, such as a utility bill.' }
      ],
      ui: {}
    }
  },
  {
    id: 'fine',
    title: 'Traffic fine',
    hint: 'Speeding notice',
    text: [
      'METRO TRAFFIC DEPARTMENT',
      'INFRINGEMENT NOTICE',
      'Notice date: 13 October 2026',
      'Notice no.: 0912 4471 3305 8',
      'Vehicle registration: CA 123-456 GP',
      'Offence: Exceeding the speed limit — 78 km/h in a 60 km/h zone',
      'Date of offence: 02 October 2026, 07:41',
      'Place: Corner Main Rd and 4th Ave',
      '',
      'Penalty: R 500.00',
      'Discounted penalty if paid within 32 days of the notice date: R 250.00',
      '',
      'You may (a) pay the penalty; (b) submit representations asking for the notice to be cancelled; or (c) nominate the person who was driving, within 32 days of the notice date. If you do nothing, a courtesy letter and later an enforcement order may follow, and the penalty can increase. Payment methods are listed on the back of this notice.'
    ].join('\n'),
    result: {
      documentType: 'Traffic fine for speeding',
      sender: 'Metro Traffic Department',
      headline: 'Pay R250 by 14 November 2026 to halve the fine, or tell them it is wrong or someone else drove.',
      summary: 'Your car was recorded going 78 km/h in a 60 km/h zone on 2 October 2026. The fine is R500. If you pay within 32 days of the notice date, you pay only R250. You can also ask for the fine to be cancelled, or name the person who was driving. If you do nothing, the fine can grow.',
      urgency: 'soon',
      urgencyLabel: 'Decide within 30 days',
      deadline: '2026-11-14',
      keyFacts: [
        { label: 'Fine', value: 'R 500.00' },
        { label: 'Pay by 14 Nov 2026', value: 'R 250.00 (half price)' },
        { label: 'Notice number', value: '0912 4471 3305 8' },
        { label: 'Offence', value: '78 km/h in a 60 km/h zone' },
        { label: 'When and where', value: '2 October 2026, 07:41, Main Rd and 4th Ave' }
      ],
      steps: [
        { text: 'Decide what you want to do: pay, say it is wrong, or name the driver.', by: '' },
        { text: 'If the fine is right, pay R250 using a method on the back of the notice.', by: '14 Nov 2026', date: '2026-11-14' },
        { text: 'If it is wrong, or someone else was driving, send your reply to the traffic department.', by: '14 Nov 2026', date: '2026-11-14' },
        { text: 'Keep the proof of payment or proof that you sent your reply.', by: '' }
      ],
      watchOut: [
        'The 14 November date is counted from the notice date of 13 October. Check it yourself.',
        'Doing nothing can raise the fine and lead to an enforcement order.',
        'The letter does not say how to send a reply. Ask the traffic department.'
      ],
      bring: ['This notice', 'Your driving licence (if you pay or reply in person)'],
      questions: ['What if I was not the driver?', 'What happens if I do not pay?', 'Can I pay less?'],
      scamRisk: 'low',
      scamNote: 'This looks like a normal fine notice. Scammers do copy fines, so pay only through the methods on the back, or check the notice number with the traffic department first.',
      glossary: [
        { term: 'Infringement', meaning: 'Breaking a traffic rule.' },
        { term: 'Representations', meaning: 'A written reply where you explain why the fine should be cancelled.' },
        { term: 'Nominate', meaning: 'Tell them the name of the person who was driving.' },
        { term: 'Enforcement order', meaning: 'A stronger legal step if the fine stays unpaid.' }
      ],
      ui: {}
    }
  },
  {
    id: 'sms',
    title: 'Bank SMS',
    hint: 'Suspicious message',
    text: 'Dear client, your banking profile has been SUSPENDED due to unusual activity. To avoid permanent closure verify within 2 hours: http://secure-bank-verify.example/login or reply with your ID number and PIN. Ref: 88-4471',
    result: {
      documentType: 'Text message that claims to be from your bank',
      sender: 'Unknown. It does not name a bank.',
      headline: 'This message is very likely a scam. Do not click the link and never send your PIN.',
      summary: 'The message says your bank profile is suspended and gives you 2 hours to act. It asks you to click a link or reply with your ID number and PIN. Real banks do not do this. Scammers use fear and a short deadline so you act before you think.',
      urgency: 'info',
      urgencyLabel: 'Do not respond',
      keyFacts: [
        { label: 'Claimed deadline', value: '2 hours (a pressure trick)' },
        { label: 'Link', value: 'secure-bank-verify.example (not a bank website)' },
        { label: 'Asks for', value: 'ID number and PIN' },
        { label: 'Bank named', value: 'None' }
      ],
      steps: [
        { text: 'Do not click the link and do not reply.', by: '' },
        { text: 'Check your account by calling the number on the back of your bank card, or visit a branch.', by: '' },
        { text: 'Delete the message and report it to your bank as a phishing attempt.', by: '' },
        { text: 'If you already shared your PIN, call your bank straight away and ask them to block your card.', by: '' }
      ],
      watchOut: [
        'Banks never ask for your PIN, password or one-time PIN by SMS or email.',
        'A short deadline is a classic scam sign.',
        'Do not call any number that is written in the message.'
      ],
      bring: [],
      questions: ['What if I already clicked the link?', 'How do I report this?', 'How do I know a real bank SMS?'],
      scamRisk: 'high',
      scamNote: 'It threatens you, sets a 2-hour deadline, uses an unofficial link and asks for your PIN. All four are strong signs of fraud.',
      glossary: [
        { term: 'Phishing', meaning: 'A trick message that pretends to be a trusted company so you hand over your details.' },
        { term: 'Suspended', meaning: 'Switched off for now.' },
        { term: 'PIN', meaning: 'The secret number you use with your bank card. Never share it.' }
      ],
      ui: {}
    }
  }
];
