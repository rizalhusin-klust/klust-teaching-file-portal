// Using native global fetch

async function runVerification() {
  console.log("Starting verification...");
  try {
    const assRes = await fetch('http://localhost:3001/api/assessments?course_id=1');
    const assessments = await assRes.json();
    console.log("=== ASSESSMENTS IN DATABASE ===");
    assessments.forEach(a => {
      console.log(`ID: ${a.id}, Type: ${a.type}, Title: ${a.title}, Q: ${a.question_no}, Wt: ${a.weightage}, Max: ${a.max_mark}`);
    });

    const res = await fetch('http://localhost:3001/api/grades?course_id=1');
    const grades = await res.json();

    const s1 = grades.find(g => g.matric_id === '243925026');
    const s2 = grades.find(g => g.matric_id === '243925210');

    console.log("\n=== STUDENT 1: ABDULKADIR ABDIRAHMAN ABDIWELI ===");
    console.log("Calculated Total CW:", s1.totalCW, "(Expected: 35.60)");
    console.log("Calculated Total E:", s1.totalE, "(Expected: 32.51)");
    console.log("Calculated Total Mark:", s1.totalMark, "(Expected: 68.10)");
    console.log("Calculated Grade:", s1.grade, "(Expected: B)");
    console.log("Raw Marks:", s1.rawMarks);
    console.log("Scaled Marks:", s1.scaledMarks);
    console.log("CLO Scores:", s1.cloScores);

    console.log("\n=== STUDENT 2: AL BAYATI HAJIR MUSTAFA HAMID ===");
    console.log("Calculated Total CW:", s2.totalCW, "(Expected: 50.00)");
    console.log("Calculated Total E:", s2.totalE, "(Expected: 50.00)");
    console.log("Calculated Total Mark:", s2.totalMark, "(Expected: 100.00)");
    console.log("Calculated Grade:", s2.grade, "(Expected: A+)");
    console.log("CLO Scores:", s2.cloScores);

    const obeRes = await fetch('http://localhost:3001/api/obe-metrics?course_id=1');
    const obe = await obeRes.json();
    console.log("\n=== OBE METRICS ===");
    console.log("CLO Metrics:", obe.cloMetrics);
    
    console.log("\nVerification complete!");
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

runVerification();
