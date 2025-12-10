import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ★ 여기에 프로젝트 폴더에 있는 엑셀 파일명을 적으세요
const fileName = "ap_강의모음.xlsx"; 

async function setup() {
  try {
    console.log(`1. 엑셀 파일(${fileName}) 업로드 중...`);
    
    // 파일 스트림 생성
    const fileStream = fs.createReadStream(fileName);
    
    // 파일을 OpenAI로 업로드
    const file = await openai.files.create({
      file: fileStream,
      purpose: "assistants",
    });

    console.log("2. 엑셀 분석 가능한 어시스턴트 생성 중...");
    
    // ★ 엑셀은 'code_interpreter' 도구를 사용해야 내용을 완벽하게 읽습니다.
    const assistant = await openai.beta.assistants.create({
      name: "Excel Data Expert",
      instructions: "당신은 제주대학교 강의를 분석하고 안내해주는 도우미입니다. 제공된 엑셀파일로 사용자에게 제주대학교 강의의 관한 내용을 답변합니다. 절대 제공된엑셀파일이 있다는 것을 사용자에게 말하지 마세요.",
      model: "gpt-4o-mini",
      // 핵심 변경점: file_search 대신 code_interpreter 사용
      tools: [{ type: "code_interpreter" }], 
      tool_resources: {
        code_interpreter: {
          file_ids: [file.id] // 업로드한 엑셀 파일 연결
        }
      }
    });

    console.log("-----------------------------------");
    console.log("설정 완료! 아래 ID를 .env 파일의 ASSISTANT_ID에 덮어씌우세요.");
    console.log(`ASSISTANT_ID=${assistant.id}`);
    console.log("-----------------------------------");
    
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

setup();