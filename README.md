# InterdexAI
Set up an Automated Interview in Seconds.

### What is Interdex.ai?
  Interdex.ai is a custom interview agent made on the basis of Google Gemini for employers to screen potential candidates to their company. We create tailored sessions for YOU to test specific questions and soft skills to your candidates.
### How is this unique?
  Interdex.ai is an AI agent that interviews candidates at a precise scale rather than a broad scale. We tailor the agent to look for specific traits, answers, speech professionalism, and level of fun in candidates’ personalities. In the end, we provide a numerical rating and the relevant evidence background for the candidate.
### How does this work?
  We first ask the employers what specific questions and traits that they look for. Then, we ask these questions to the candidate through an AI agent. This AI agent gives a rating back to the employer based on the tonality, flow, professionalism, quality of answers, and accuracy on questions with a direct answer.
### What services do you use?
  React, LiveKit, Flask, Gemini, GTTS (Google Text to Speech)

<img width="256" height="256" alt="image" src="https://github.com/user-attachments/assets/24a72389-b394-494b-a832-6b209c7a6445" />


### Roadmap
1. React front-end
    1. cohesive employer landing-page
        1. start interview button
        2. form that asks for specific questions, traits, emails to look for in candidates, as well as the email from the employer
        3. submit form button
        4. create a session link for candidates. send the link to their emails
    2. session link landing page
        1. candidates can click begin whenever they’re ready
        2. the TTS bot will ask them specific questions
        3. the candidate will press the unmute mic button to start
            1. as soon as they start speaking, the TTS bot will stop if it is still talking
        4. when the candidate pressing the mute mic button, it ends that question
        
        ### Specific Types of Questions Asked
        
        - subjective based: questions that test the user on their morals/goals
            - what do you bring to our company?
        - objective based: questions that test the user on the end result
            - leetcode accuracy

<img width="1062" height="678" alt="image" src="https://github.com/user-attachments/assets/cc433411-5bb4-4b6e-9032-6fd2ff560636" />
