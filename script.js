let emotionData = {};
let partSensations = {};
let sensationEmotions = {};
let currentEmotionIndex = 0;
const selections = {
  sensations: [],
  emotions: [],
  nuanced: {},
  needs: {},
};
/* IDEAS FROM NICK
      - Make text in selected items change-- stray clicks might not obvious to someone with low vision
      - Button to copy summary page?
      - Input to enter text for "something else"?
    */
/* NEXT
   See chatgpt for how to make nav better for screen reader
   */
const step1 = document.getElementById("step1");
const sensationsContainer = document.getElementById("sensationsContainer");
const skipSensationsBtn = document.getElementById("skipSensationsBtn");
const step1Btn = document.getElementById("step1Btn");

const step2 = document.getElementById("step2");
const emotionContainer = document.getElementById("emotionContainer");
const nextEmotionBtn = document.getElementById("nextEmotionBtn");
const prevEmotionBtn = document.getElementById("prevEmotionBtn");

const step3 = document.getElementById("step3");
const summaryContainer = document.getElementById("summaryContainer");
const step3BackBtn = document.getElementById("step3BackBtn");
const copySummaryBtn = document.getElementById("copyBtn");

async function loadDataset() {
  const response = await fetch("emotionData.json");
  emotionData = await response.json();

  let sensations, sensation;
  for (const emotion in emotionData) {
    sensations = emotionData[emotion].sensations;
    for (const bodyPart in sensations) {
      if (partSensations[bodyPart] === undefined) {
        partSensations[bodyPart] = [];
      }
      sensations[bodyPart].forEach((sensation) => {
        partSensations[bodyPart].push(sensation);
        sensationEmotions[sensation] = emotion;
      });
    }
    emotionData[emotion].sensations = Object.values(sensations).flat();
  }
  generateSensations();
}

function createTextElement(type, content) {
  const element = document.createElement(type);
  element.textContent = content;
  return element;
}

function createCheckbox(value, container, addBreak) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.value = value;

  const label = document.createElement("label");
  label.appendChild(input);
  label.appendChild(document.createTextNode(" " + value));

  container.appendChild(label);
  if (addBreak) container.appendChild(document.createElement("br"));

  return input;
}

function generateSensations() {
  sensationsContainer.appendChild(document.createElement("br"));
  sensationsContainer.appendChild(createTextElement("h2", "I notice..."));
  const line = sensationsContainer.appendChild(document.createElement("div"));
  line.classList.add("horizontal-line");

  for (part in partSensations) {
    sensationsContainer.appendChild(
      createTextElement(
        "h3",
        part.charAt(0).toUpperCase() + part.slice(1),
        false
      )
    );
    const groupDiv = document.createElement("div");
    groupDiv.className = "checkbox-group";
    sensationsContainer.appendChild(groupDiv);

    partSensations[part].forEach((sensation) => {
      createCheckbox(sensation, groupDiv);
    });
  }
}

skipSensationsBtn.addEventListener("click", () => {
  selections.emotions = Object.keys(emotionData);
  step1.classList.add("hidden");
  step2.classList.remove("hidden");
  nextEmotionBtn.classList.remove("hidden");
  renderEmotion();
});

step1Btn.addEventListener("click", () => {
  const checked = Array.from(
    document.querySelectorAll('#step1 input[type="checkbox"]:checked')
  );

  selections.sensations = checked.map((cb) => cb.value);
  let matchedEmotions = new Set(
    selections.sensations.map((sensation) => sensationEmotions[sensation])
  );

  step1.classList.add("hidden");
  step2.classList.remove("hidden");
  if (matchedEmotions.size === 0) {
    nextEmotionBtn.classList.add("hidden");
    emotionContainer.innerHTML = `<h2 id="error">You did not select any sensations.</h2>`;
    document.getElementById("error").focus();
    return;
  }
  nextEmotionBtn.classList.remove("hidden");
  selections.emotions = [...matchedEmotions];
  renderEmotion();
});

function renderEmotion() {
  emotionContainer.innerHTML = "";

  const emotion = selections.emotions[currentEmotionIndex];
  const currentEmotionData = emotionData[emotion];

  emotionContainer.appendChild(document.createElement("br"));
  const h2 = emotionContainer.appendChild(createTextElement("h2", emotion));
  const line = emotionContainer.appendChild(document.createElement("div"));
  line.classList.add("horizontal-line");

  if (selections.sensations.length > 0) {
    const sensedLabels = [...selections.sensations].filter(
      (sensation) => sensationEmotions[sensation] === emotion
    );
    emotionContainer.appendChild(
      createTextElement("p", `You noticed ${sensedLabels.join(", ")}.`)
    );

    const sensationValuesSet = new Set(selections.sensations);
    const excludedLabels = currentEmotionData.sensations.filter(
      (sensation) => !sensationValuesSet.has(sensation)
    );
    emotionContainer.appendChild(
      createTextElement(
        "p",
        `Other sensations of ${emotion} can include ${excludedLabels.join(
          ", "
        )}.`
      )
    );
  } else {
    emotionContainer.appendChild(
      createTextElement(
        "p",
        `Sensations of ${emotion} can include ${currentEmotionData.sensations.join(
          ", "
        )}.`
      )
    );
  }

  emotionContainer.appendChild(createTextElement("h3", "I feel..."));
  if (selections.nuanced[emotion] === undefined)
    selections.nuanced[emotion] = [];

  const nuancedGroupDiv = document.createElement("div");
  nuancedGroupDiv.className = "checkbox-group";
  emotionContainer.appendChild(nuancedGroupDiv);

  currentEmotionData.nuancedEmotions.forEach((nuEmotion) => {
    const cb = createCheckbox(nuEmotion, nuancedGroupDiv);
    cb.dataset.type = "nuanced";
    cb.dataset.emotion = emotion;
    if (selections.nuanced[emotion].includes(nuEmotion)) cb.checked = true;
  });

  emotionContainer.appendChild(document.createElement("br"));

  emotionContainer.appendChild(
    createTextElement(
      "h3",
      `I need ${currentEmotionData.coreNeed} and will try...`
    )
  );
  if (selections.needs[emotion] === undefined) selections.needs[emotion] = [];

  currentEmotionData.nuancedNeeds.forEach((nuNeed) => {
    const cb = createCheckbox(nuNeed, emotionContainer, true);
    cb.dataset.type = "need";
    cb.dataset.emotion = emotion;
    if (selections.needs[emotion].includes(nuNeed)) cb.checked = true;
  });

  nextEmotionBtn.textContent =
    currentEmotionIndex < selections.emotions.length - 1
      ? "Next Emotion"
      : "See Summary";
}

function saveCurrentSelections() {
  const emotion = selections.emotions[currentEmotionIndex];
  selections.nuanced[emotion] = Array.from(
    document.querySelectorAll(
      `input[data-type="nuanced"][data-emotion="${emotion}"]:checked`
    )
  ).map((cb) => cb.value);
  selections.needs[emotion] = Array.from(
    document.querySelectorAll(
      `input[data-type="need"][data-emotion="${emotion}"]:checked`
    )
  ).map((cb) => cb.value);
}

nextEmotionBtn.addEventListener("click", () => {
  saveCurrentSelections();
  if (currentEmotionIndex < selections.emotions.length - 1) {
    currentEmotionIndex++;
    renderEmotion();
  } else {
    step2.classList.add("hidden");
    step3.classList.remove("hidden");
    renderSummary();
  }
});

prevEmotionBtn.addEventListener("click", () => {
  saveCurrentSelections();
  if (currentEmotionIndex > 0) {
    currentEmotionIndex--;
    renderEmotion();
  } else {
    step2.classList.add("hidden");
    step1.classList.remove("hidden");
  }
});

function renderSummary() {
  saveCurrentSelections();
  summaryContainer.innerHTML = "";

  const selectedSensations = selections.sensations;
  const selectedNuanced = selections.nuanced;
  const selectedNeeds = selections.needs;

  if (
    !(
      selectedSensations.length ||
      Object.values(selectedNuanced).flat().length ||
      Object.values(selectedNeeds).flat().length
    )
  ) {
    summaryContainer.innerHTML = `<h2 id="error">You did not select anything. Go back to previous emotion/s or refresh page to start over.</h2>`;
    return;
  }

  selections.emotions.forEach((emotion) => {
    const emotionSensations = [...selectedSensations].filter(
      (sensation) => sensationEmotions[sensation] === emotion
    );
    const nuancedEmotions = selectedNuanced[emotion];
    const emotionNeeds = selectedNeeds[emotion];

    if (
      !(
        emotionSensations.length ||
        emotionNeeds.length ||
        nuancedEmotions.length
      )
    ) {
      return;
    }

    summaryContainer.appendChild(document.createElement("br"));
    summaryContainer.appendChild(
      createTextElement("h3", `Core Emotion: ${emotion}`, true)
    );
    const line = summaryContainer.appendChild(document.createElement("div"));
    line.classList.add("horizontal-line");

    let sensationText;
    if (emotionSensations.length > 0) {
      sensationText = createTextElement(
        "h4",
        `I notice ${emotionSensations.join(", ")}`
      );
    } else {
      sensationText = createTextElement(
        "p",
        `Sensations of ${emotion} can include ${emotionData[
          emotion
        ].sensations.join(", ")}.`
      );
    }
    summaryContainer.appendChild(sensationText);

    let nuacedText;
    if (nuancedEmotions.length > 0) {
      nuacedText = `Specifically, I feel ${nuancedEmotions.join(", ")}`;
    } else {
      nuacedText = "No specific feelings selected";
    }
    summaryContainer.appendChild(createTextElement("h4", nuacedText));

    summaryContainer.appendChild(
      createTextElement("h4", `I need ${emotionData[emotion].coreNeed}`)
    );

    if (emotionNeeds.length > 0) {
      emotionNeeds.forEach((need) => {
        createCheckbox(need, summaryContainer, true);
      });
    } else {
      createCheckbox("No specific needs selected.", summaryContainer);
      summaryContainer.appendChild(document.createElement("br"));
    }
  });
}

step3BackBtn.addEventListener("click", () => {
  step3.classList.add("hidden");
  if (selections.emotions.length === 0) {
    step1.classList.remove("hidden");
  } else {
    step2.classList.remove("hidden");
  }
});

copySummaryBtn.addEventListener("click", () => {
  const summaryText = document.getElementById("summaryContainer").innerText;
  navigator.clipboard
    .writeText(summaryText)
    .then(() => {
      console.log("Summary copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
});

loadDataset();
