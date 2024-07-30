function calcularProbabilidadeImplicita(odds) {
  return 1 / odds;
}

function calcularOvervalue(probabilidadeReal, odds) {
  const probabilidadeImplicita = calcularProbabilidadeImplicita(odds);
  return (probabilidadeReal / probabilidadeImplicita) * 100;
}

function calcularROI(probabilidadeReal, odds) {
  return (probabilidadeReal * odds - 1) * 100;
}

function dividirMensagem(mensagem, maxLength = 4096) {
  const partes = [];
  while (mensagem.length > 0) {
    if (mensagem.length > maxLength) {
      let i = maxLength;
      while (i > 0 && mensagem[i] !== '\n') {
        i--;
      }
      if (i === 0) {
        i = maxLength;
      }
      partes.push(mensagem.slice(0, i));
      mensagem = mensagem.slice(i);
    } else {
      partes.push(mensagem);
      mensagem = '';
    }
  }
  return partes;
}

module.exports = {
  calcularProbabilidadeImplicita,
  calcularOvervalue,
  calcularROI,
  dividirMensagem
};
