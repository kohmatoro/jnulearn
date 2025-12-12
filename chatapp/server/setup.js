import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function setup() {
  try {
    // lectures.json 파일 경로 (상위 폴더의 src/data에서 복사)
    const lecturesPath = path.join(process.cwd(), "lectures.json");
    
    // lectures.json이 없으면 생성 (테스트용)
    if (!fs.existsSync(lecturesPath)) {
      console.log("lectures.json을 찾을 수 없습니다.");
      console.log("../src/data/lectures.json에서 lectures.json을 복사해주세요.");
      return;
    }

    console.log("1. lectures.json 파일을 읽는 중...");
    
    const lecturesData = JSON.parse(fs.readFileSync(lecturesPath, 'utf-8'));
    
    console.log(`   → ${lecturesData.length}개의 강의 데이터 로드 완료`);
    
    // JSON을 텍스트 파일로 변환 (OpenAI 업로드용)
    const txtContent = JSON.stringify(lecturesData, null, 2);
    const txtPath = path.join(process.cwd(), "lectures_data.txt");
    fs.writeFileSync(txtPath, txtContent);
    
    console.log("2. 텍스트 파일로 변환 후 OpenAI에 업로드 중...");
    
    const fileStream = fs.createReadStream(txtPath);
    const file = await openai.files.create({
      file: fileStream,
      purpose: "assistants",
    });

    console.log("   → 파일 업로드 완료");
    console.log("3. 강의 추천 어시스턴트 생성 중...");
    
    const assistant = await openai.beta.assistants.create({
      name: "JNU Lecture Recommender",
      instructions: `당신은 제주대학교(JNU) 강의 추천 전문 챗봇입니다.
      
제공된 강의 데이터(lectures_data.txt)를 참고하여 사용자의 요청에 답변합니다.

주요 역할:
1. 사용자가 원하는 강의 찾아주기 (강의명, 교수, 학년, 학점, 시간 등으로 검색)
2. 강의 정보 제공 (강의실, 시간, 정원, 담당 교수 등)
3. 개인화된 강의 추천 (학년, 학점, 이수구분 고려)
4. 시간표 구성 도움 (시간 충돌 확인, 학점 조합 제안)
5. 꿀강좌 추천 (낮은 경쟁률, 많은 인원 수강 강의)

대답 시 주의사항:
- 정확한 강의 정보만 제공하세요
- 제공된 데이터에 없는 강의는 없다고 명시하세요
- 항상 친절하고 도움이 되는 톤으로 응답하세요
- 사용자 질문에 명확히 답변하세요`,
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [] // 동적으로 생성됨
        }
      }
    });

    console.log("-----------------------------------");
    console.log("✅ 설정 완료!");
    console.log(`ASSISTANT_ID=${assistant.id}`);
    console.log("-----------------------------------");
    console.log("\n다음 내용을 .env 파일에 추가하세요:");
    console.log(`ASSISTANT_ID=${assistant.id}`);
    
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
  }
}

setup();