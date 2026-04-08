const fs = require('fs');
let code = fs.readFileSync('src/components/CommunicationPortal.tsx', 'utf8');

// Fix 1: Add couplesLoading state
code = code.replace(
  'const [allCouples, setAllCouples] = useState<any[]>([]);',
  'const [allCouples, setAllCouples] = useState<any[]>([]);\n  const [couplesLoading, setCouplesLoading] = useState(true);'
);

// Fix 2a: Add setCouplesLoading(true) after try
code = code.replace(
  'try {\n      const { data: { user } } = await supabase.auth.getUser();',
  'try {\n      setCouplesLoading(true);\n      const { data: { user } } = await supabase.auth.getUser();'
);

// Fix 2b: Update if return
code = code.replace(
  /if \(\!user\?\.id\) return;/g,
  'if (!user?.id) { setCouplesLoading(false); return; }'
);

// Fix 2c: Add setEditCoupleInfo
code = code.replace(
  'setAllCouples(mappedCouples);\n      }',
  'setAllCouples(mappedCouples);\n        setEditCoupleInfo(mappedCouples[0]);\n      }'
);

// Fix 2d: Add finally block
code = code.replace(
  'console.error("❌ Error loading couples from Supabase:", err);\n    }\n  };',
  'console.error("❌ Error loading couples from Supabase:", err);\n    } finally {\n      setCouplesLoading(false);\n    }\n  };'
);

// Fix 3: Add loading screen
code = code.replace(
  '  return (\n    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">',
  '  if (couplesLoading) {\n    return (\n      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50">\n        <div className="text-center">\n          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>\n          <p className="text-gray-600">Loading your ceremonies...</p>\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">'
);

fs.writeFileSync('src/components/CommunicationPortal.tsx', code);
console.log('All fixes applied!');
