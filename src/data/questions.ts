import { QuizQuestion } from "../types/quiz";

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Qual é a maior artéria do corpo humano?",
    options: ["Artéria femoral", "Artéria carótida", "Artéria aorta", "Artéria pulmonar"],
    correctAnswer: 2,
    explanation: "A artéria aorta é a maior e principal artéria do corpo humano, transportando sangue rico em oxigênio do ventrículo esquerdo do coração para o resto do corpo.",
    difficulty: "fácil"
  },
  {
    id: 2,
    question: "Qual destas estruturas NÃO faz parte do sistema nervoso central?",
    options: ["Medula espinhal", "Cerebelo", "Nervos periféricos", "Tálamo"],
    correctAnswer: 2,
    explanation: "Os nervos periféricos fazem parte do sistema nervoso periférico, não do sistema nervoso central, que é composto pelo encéfalo (cérebro, cerebelo e tronco encefálico) e pela medula espinhal.",
    difficulty: "fácil"
  },
  {
    id: 3,
    question: "Qual osso do crânio humano protege o cérebro posteriormente?",
    options: ["Osso parietal", "Osso frontal", "Osso temporal", "Osso occipital"],
    correctAnswer: 3,
    explanation: "O osso occipital forma a parte posterior e a base do crânio, protegendo a parte posterior do cérebro e contendo o forame magno, por onde a medula espinhal se conecta ao encéfalo.",
    difficulty: "médio"
  },
  {
    id: 4,
    question: "Qual das seguintes estruturas pertence ao sistema linfático?",
    options: ["Baço", "Vesícula biliar", "Pâncreas", "Apêndice vermiforme"],
    correctAnswer: 0,
    explanation: "O baço é um órgão do sistema linfático responsável pela filtragem do sangue, armazenamento de células sanguíneas e produção de linfócitos, células importantes para a imunidade.",
    difficulty: "médio"
  },
  {
    id: 5,
    question: "Qual das seguintes camadas da pele contém as terminações nervosas, glândulas sudoríparas e folículos pilosos?",
    options: ["Epiderme", "Derme", "Hipoderme", "Estrato córneo"],
    correctAnswer: 1,
    explanation: "A derme é a camada intermediária da pele que contém as terminações nervosas, vasos sanguíneos, glândulas sudoríparas e sebáceas, além dos folículos pilosos.",
    difficulty: "médio"
  },
  {
    id: 6,
    question: "Em relação à articulação do joelho, qual estrutura é responsável por limitar a hiperextensão e o deslocamento anterior da tíbia?",
    options: ["Ligamento colateral medial", "Ligamento colateral lateral", "Ligamento cruzado anterior", "Ligamento cruzado posterior"],
    correctAnswer: 2,
    explanation: "O ligamento cruzado anterior (LCA) é responsável por limitar a hiperextensão do joelho e o deslocamento anterior da tíbia em relação ao fêmur, sendo uma das estruturas mais importantes para a estabilidade dessa articulação.",
    difficulty: "difícil"
  },
  {
    id: 7,
    question: "Qual das seguintes estruturas NÃO faz parte do ouvido médio?",
    options: ["Martelo", "Bigorna", "Estribo", "Cóclea"],
    correctAnswer: 3,
    explanation: "A cóclea é uma estrutura do ouvido interno responsável pela transdução dos sinais sonoros em impulsos nervosos. O ouvido médio é composto pelos três ossículos: martelo, bigorna e estribo.",
    difficulty: "difícil"
  },
  {
    id: 8,
    question: "Na circulação pulmonar, qual vaso transporta sangue venoso do ventrículo direito para os pulmões?",
    options: ["Veia pulmonar", "Artéria pulmonar", "Veia cava superior", "Artéria aorta"],
    correctAnswer: 1,
    explanation: "A artéria pulmonar transporta sangue venoso (pobre em oxigênio) do ventrículo direito do coração para os pulmões, onde ocorre a hematose (oxigenação do sangue).",
    difficulty: "difícil"
  },
  {
    id: 9,
    question: "Qual nervo craniano é responsável pela inervação dos músculos extrínsecos do olho, exceto o reto lateral e o oblíquo superior?",
    options: ["Nervo oculomotor (III)", "Nervo troclear (IV)", "Nervo abducente (VI)", "Nervo óptico (II)"],
    correctAnswer: 0,
    explanation: "O nervo oculomotor (III par craniano) inerva a maioria dos músculos extrínsecos do olho, exceto o músculo reto lateral (inervado pelo nervo abducente) e o músculo oblíquo superior (inervado pelo nervo troclear).",
    difficulty: "difícil"
  },
  {
    id: 10,
    question: "Na análise topográfica abdominal, qual dos seguintes órgãos está localizado primariamente no hipocôndrio direito?",
    options: ["Baço", "Estômago", "Fígado", "Cólon descendente"],
    correctAnswer: 2,
    explanation: "O fígado está localizado principalmente no hipocôndrio direito, região superior direita do abdome, abaixo do diafragma. O baço está no hipocôndrio esquerdo, o estômago no epigástrio e hipocôndrio esquerdo, e o cólon descendente no flanco esquerdo e fossa ilíaca esquerda.",
    difficulty: "difícil"
  }
]; 