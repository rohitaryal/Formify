// ==UserScript==
// @name         Google Formify
// @version      2.6
// @description  Aid Google Form with Gemini AI
// @author       rohitaryal
// @license      MIT
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_addElement
// @grant        GM.xmlHttpRequest
// @connect      googleapis.com
// @namespace    https://docs.google.com/
// @match        https://docs.google.com/forms/d/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @downloadURL https://update.greasyfork.org/scripts/480209/Google%20Formify.user.js
// @updateURL https://update.greasyfork.org/scripts/480209/Google%20Formify.meta.js
// ==/UserScript==

"use strict";

let apiKey = localStorage.getItem("apiKey");
let isOldUser = localStorage.getItem("old_user");

while (!apiKey || apiKey.length <= 10) {
  apiKey = window.prompt(
    "Please enter your API key. To get one for free goto 'https://makersuite.google.com/app/apikey' and paste your api key here."
  );

  if (apiKey == null) {
    console.log(apiKey);
    window.open("https://makersuite.google.com/app/apikey", "_blank");
  } else {
    localStorage.setItem("apiKey", apiKey);
  }
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

class Question {
  #headers = {
    "Content-Type": "application/json",
  };

  #onerror = (error) => {
    console.warn(": Some error occured while sending request", error);
  };

  constructor(
    question, // (string)
    questionImage, // (string)(url)
    options, // (Array[{}])
    isOptional, // (boolean)
    questionType, // (string) textbox, multipleChoice(same for checkbox)
    htmlNode // (HTMLElement)
  ) {
    this.question = question;
    this.questionImage = questionImage;
    this.options = options;
    this.isOptional = isOptional;
    this.questionType = questionType;
    this.aiAnswer = null;

    if (!unsafeWindow.deleteNode) {
      this.htmlNode = htmlNode;
    }
  }

  async aiAssist() {
    let data = null;

    if (this.questionType == "multipleChoice") {
      let finalOptions = "";
      this.options.forEach((option, index) => {
        finalOptions += option.value + "\n";
      });

      data = `{"contents":[{"parts":[{"text":"Choose only the one correct option for this question: Question: ${this.question} Options: ${finalOptions}.\n"}]}]}`;
    } else if (this.questionType == "checkbox") {
      let finalOptions = "";
      this.options.forEach((option, index) => {
        finalOptions += option.value + "\n";
      });

      data = `{"contents":[{"parts":[{"text":"Choose the correct option for this question(More than one can be true): Question: ${this.question} Options: ${finalOptions}.\n"}]}]}`;
    } else {
      data = `{"contents":[{"parts":[{"text":"Write something like a human on topic: '${this.question}'.\n Start now!"}]}]}`;
    }

    let request = await GM.xmlHttpRequest({
      method: "POST",
      url: url,
      headers: this.#headers,
      data,
    }).catch((error) => this.#onerror);

    this.aiAnswer = this.parseJSON(request);
  }

  async fillUp() {
    await this.aiAssist();

    if (this.aiAnswer?.trim() == "" || !this.aiAnswer) {
      this.htmlNode.querySelector(".ai-answer").textContent =
        "😭 Failed to fetch answers from server... ";
    } else {
      this.htmlNode.querySelector(".ai-answer").textContent = this.aiAnswer;
    }

    if (this.questionType == "multipleChoice") {
      let allOptions = [...this.htmlNode.querySelectorAll("label")];

      this.options.forEach((option, index) => {
        if (this.aiAnswer?.includes(option.value)) {
          allOptions[index].click();
        }
      });
    } else if (this.questionType == "checkbox") {
      let allOptions = [...this.htmlNode.querySelectorAll("label")];

      this.options.forEach((option, index) => {
        if (this.aiAnswer?.includes(option.value)) {
          allOptions[index].click();
        }
      });
    } else {
      let allTextboxes = [
        ...this.htmlNode.querySelectorAll("input[type=text], textarea"),
      ];

      allTextboxes.forEach((element) => {
        element.value = this.aiAnswer;
      });
    }
  }

  parseJSON(data) {
    let parsedAnswer = null;

    try {
      let parsedData = JSON.parse(data.responseText);
      parsedAnswer = parsedData?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (e) {
      console.warn("Failed to parse to JSON.", e);
    }

    return parsedAnswer;
  }
}

class GoogleFormParser {
  parse() {
    let finalQuestionList = [];

    const googleFormTitle = document.querySelector(
      ".F9yp7e.ikZYwf.LgNcQe"
    )?.textContent;
    const googleFormDescription =
      document.querySelector(".cBGGJ.OIC90c")?.textContent;
    const questionCards = document.querySelectorAll("[jsmodel='CP1oW']");

    if (
      questionCards == undefined ||
      questionCards == null ||
      questionCards.length == 0
    ) {
      throw ": No questions found. Maybe this form is empty";
    }

    questionCards.forEach((card, index) => {
      let parsedDataArray = null;

      let dataParams = card.getAttribute("data-params")?.replace("%.@.", "[");

      if (!dataParams) {
        console.warn(
          `No data-params found for card index ${index}. So, skipping this card.`,
          card
        );
        return;
      }

      try {
        parsedDataArray = JSON.parse(dataParams);
      } catch (e) {
        console.warn(
          `Failed to parse obtained data-params to JSON: ${dataParams}`,
          e
        );
        return;
      }

      let questionImage = null;
      let question = parsedDataArray?.[0]?.[1];
      let subdivsInsideCard = card.querySelectorAll(".geS5n");

      if (!!subdivsInsideCard.length != 0) {
        subdivsInsideCard = [...subdivsInsideCard[0].childNodes];
      }
      subdivsInsideCard = subdivsInsideCard.filter((item) => {
        return item.tagName == "DIV";
      });

      // Length >= 4 means question might have image;
      if (subdivsInsideCard.length >= 4) {
        subdivsInsideCard.forEach((div) => {
          let imageTags = div.querySelectorAll("img");

          // Either theres no img elements or we already found URL.
          if (imageTags.length == 0 || !!questionImage) {
            return;
          }

          questionImage = imageTags[0]?.src;
        });
      }

      let questionType = null;

      if (card.querySelectorAll(".Yri8Nb").length != 0) {
        questionType = "checkbox";
      } else if (card.querySelectorAll(".ajBQVb").length != 0) {
        questionType = "multipleChoice";
      } else if (
        card.querySelectorAll("input[type=text], textarea").length == 1
      ) {
        questionType = "textbox";
      }

      let options = parsedDataArray?.[0]?.[4]?.[0]?.[1];

      options = options?.map((option, index) => {
        let image = null;
        if (option.length >= 6) {
          image = card
            .querySelectorAll("label")
            [index]?.querySelector("img")?.src;
        }

        return {
          value: option[0],
          image,
        };
      });

      let isOptional = parsedDataArray?.[0]?.[4]?.[0]?.[2];

      let finalQuestionBody = new Question(
        question,
        questionImage,
        options,
        isOptional,
        questionType,
        card
      );

      finalQuestionList.push(finalQuestionBody);
    });

    return finalQuestionList;
  }
}

(function () {
  let googleForm = new GoogleFormParser();

  let questions = googleForm.parse();

  console.log(questions);

  let style = document.createElement("style");
  style.textContent = `.ai-container *{margin:0;padding:0;box-sizing:border-box;}.ai-container{margin-bottom: 10px;width:100%;color:#343232;padding:8px 0;background-color:#fff;border-radius:10px;box-shadow:rgba(9,30,66,.25) 0 4px 8px -2px,rgba(9,30,66,.08) 0 0 0 1px}.ai-container .ai-footer,.ai-container .ai-header{padding:4px 16px 10px;display:flex;align-items:center;justify-content:space-between}.ai-container .ai-header .ai-title{font-weight:bolder;font-size:15px}.ai-container .ai-header ul{list-style-type:none;display:flex;align-items:center;justify-content:space-between}.ai-container .ai-header ul li{font-weight:bolder;font-size:small;padding:0 6px;cursor:pointer;transition-duration:.2s;border:2px solid transparent;margin-right:8px;border-radius:4px}.ai-container .ai-header ul li:hover{color:#fff;background-color:#ff4500}.ai-container hr{border:1px solid #42ea42}.ai-container .ai-answer{font-size:13px;padding:16px 16px 8px 16px;}.ai-container .ai-footer{padding:10px 0 0 8px;width:100%;color:orange}.ai-container .ai-footer .ai-circle{display:flex;align-items:center;justify-content:center}.ai-container .ai-footer .ai-circle li{width:15px;color:#42ea42}.ai-container .ai-footer .ai-warning{font-size:10px;width:100%}`;
  document.head.appendChild(style);

  questions.forEach((question) => {
    const container = document.createElement("div");
    container.className = "ai-container";

    const divHeader = document.createElement("div");
    divHeader.className = "ai-header";

    const divTitle = document.createElement("div");
    divTitle.className = "ai-title";
    divTitle.textContent = "🦕 Gemini Pro";

    const ul = document.createElement("ul");

    const liSearch = document.createElement("li");
    liSearch.id = "ai-search";
    liSearch.textContent = "SEARCH";

    const liCopy = document.createElement("li");
    liCopy.id = "ai-copy";
    liCopy.textContent = "COPY";

    const hr = document.createElement("hr");

    const pAnswer = document.createElement("p");
    pAnswer.className = "ai-answer";
    pAnswer.textContent = "I am working on it. Please wait....";

    const divFooter = document.createElement("div");
    divFooter.className = "ai-footer";

    const pWarning = document.createElement("p");
    pWarning.className = "ai-warning";
    pWarning.textContent =
      "*Note: Not all AI generated content are 100% accurate. Use Search feature for double check.";

    const divCircle = document.createElement("div");
    divCircle.className = "ai-circle";

    const liCircle = document.createElement("li");

    divHeader.appendChild(divTitle);
    divHeader.appendChild(ul);
    ul.appendChild(liSearch);
    ul.appendChild(liCopy);

    divFooter.appendChild(pWarning);
    divFooter.appendChild(divCircle);
    divCircle.appendChild(liCircle);

    container.appendChild(divHeader);
    container.appendChild(hr);
    container.appendChild(pAnswer);
    container.appendChild(divFooter);

    question.htmlNode.appendChild(container);

    let options = "";
    let questionValue = question.question;

    question?.options?.forEach((option) => {
      options += option.value + "\n";
    });

    liSearch.addEventListener("click", (e) => {
      e.preventDefault();

      window.open(
        "https://google.com/search?q=" + questionValue + options,
        "_blank"
      );
    });

    liCopy.addEventListener("click", (e) => {
      setTimeout(function () {
        liCopy.textContent = "COPY";
      }, 3000);

      e.preventDefault();
      navigator.clipboard.writeText(questionValue + options);
      liCopy.textContent = "COPIED";
    });
  });

  questions.forEach((element) => {
    element.fillUp();
  });

  // Add a keyboard shortcut.

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.altKey) {
      let aiElement = document.querySelectorAll(".ai-container");
      aiElement.forEach((container) => {
        if (container.style.display != "none") {
          container.style.display = "none";
        } else {
          container.style.display = "block";
        }
      });
    }
  });

  if (!isOldUser) {
    alert("You can press CTRL + ALT key to hide/unhide the AI");
    localStorage.setItem("old_user", "true");
  }
})();
