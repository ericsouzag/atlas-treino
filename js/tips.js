// Guias e dicas. Texto informativo geral, não substitui orientação de médico ou nutricionista.

export const GUIAS = [
  { id: 'proteina', titulo: 'Proteína: quanto e como distribuir', corpo: [
    'Para quem treina, 1,6 a 2,2 g de proteína por kg de peso ao dia é a faixa mais usada na literatura para preservar e construir músculo. Em déficit calórico, vá para a parte alta da faixa.',
    'Distribua em 3 a 5 refeições com 25 a 40 g cada. Ovos, frango, carne, peixe, iogurte, queijo cottage, feijão com arroz e whey ajudam a chegar lá.',
    'Passar de 2,2 g/kg raramente traz benefício extra. Quem tem doença renal precisa de orientação médica antes de aumentar proteína.'] },
  { id: 'sono', titulo: 'Sono: o treino que você faz deitado', corpo: [
    'Dormir pouco aumenta a fome, reduz a força e piora a recuperação. Mire em 7 a 9 horas, com horários regulares.',
    'Se o peso trava e você dorme mal, melhorar o sono costuma ajudar mais do que cortar mais calorias.'] },
  { id: 'progressao', titulo: 'Progressão de carga', corpo: [
    'Músculo cresce quando você faz um pouco mais do que fez antes: mais carga, mais repetições ou melhor execução.',
    'Regra simples: quando fizer o topo da faixa de repetições em todas as séries (por exemplo, 3x10 em uma faixa de 6-10), aumente de 2 a 5% a carga na próxima vez.',
    'Anote cargas e repetições no app. Sem registro é difícil saber se está progredindo. Deixe de 1 a 3 repetições de reserva na maioria das séries.'] },
  { id: 'deload', titulo: 'Deload: quando aliviar', corpo: [
    'A cada 6 a 10 semanas de treino pesado, vale uma semana mais leve: mesmo exercício, 50% das séries e cargas um pouco menores.',
    'Sinais de que precisa: cargas caindo por 2 ou mais treinos, dores articulares persistentes, sono ruim e falta de vontade de treinar.'] },
  { id: 'hidratacao', titulo: 'Hidratação', corpo: [
    'Uma referência prática é cerca de 35 ml por kg de peso ao dia, somando água, chás e alimentos. Em dias de treino, calor e suor intenso, beba mais.',
    'Urina clara a amarelo-claro costuma indicar boa hidratação. Beba ao longo do dia, não só junto das refeições.'] },
  { id: 'acucar', titulo: 'Açúcar, ultraprocessados e bebidas açucaradas', corpo: [
    'A OMS recomenda manter o açúcar livre abaixo de 10% das calorias (cerca de 50 g em dieta de 2000 kcal), idealmente 5%.',
    'Bebidas açucaradas são o ponto mais fácil de cortar: são muitas calorias que não dão saciedade. Troque por água, água com gás, café sem açúcar ou versões zero.',
    'Ultraprocessados são fáceis de comer demais. Não precisam sumir, mas vale manter comida de verdade como base: arroz, feijão, ovos, carnes, frutas, legumes.'] },
  { id: 'deficit', titulo: 'Déficit calórico sem destruir o músculo', corpo: [
    'Um déficit de 15 a 25% do gasto costuma perder gordura sem sacrificar muito músculo, desde que haja treino de força e proteína alta.',
    'Perder mais de 1% do peso por semana, por muitas semanas, aumenta o risco de perder músculo, ficar sem energia e se frustrar.',
    'Pausas de 1 a 2 semanas na manutenção (diet break) podem ajudar a aderência em dietas longas.'] },
  { id: 'superavit', titulo: 'Superávit para ganhar músculo', corpo: [
    'Um superávit pequeno (5 a 15%) e peso subindo de 0,25 a 0,5% por semana costuma ser suficiente. Comer muito mais não acelera o músculo, só aumenta a gordura.',
    'O ganho máximo de massa magra é lento: algo como 1 a 1,5% do peso por mês para iniciantes, 0,5% para intermediários, 0,25% para avançados.'] },
  { id: 'medidas', titulo: 'Como medir direito', corpo: [
    'Pese-se sempre nas mesmas condições (de manhã, após o banheiro, antes de comer). O peso oscila 1 a 3 kg por água e comida; olhe a média da semana, não o dia.',
    'Meça cintura na altura do umbigo, pescoço abaixo do pomo de Adão, quadril na parte mais larga. Use a fita sem apertar, no mesmo horário.',
    'Cada método de gordura corporal tem erro: dobras cutâneas ±3-5%, bioimpedância ±2-4%, fórmula da Marinha ±3-4%. O importante é usar sempre o mesmo método e olhar a tendência.'] },
  { id: 'fome', titulo: 'Fome e intervalos entre refeições', corpo: [
    'Ficar mais de 5 a 6 horas sem comer costuma terminar em exagero. Planeje um lanche com proteína no meio da tarde.',
    'Fibras (verduras, frutas, leguminosas, aveia) e proteína são os maiores aliados da saciedade.'] },
  { id: 'saude', titulo: 'Avisos de saúde', corpo: [
    'O Atlas Fitness não substitui médico, nutricionista ou educador físico. As calorias e macros dos alimentos são estimativas; as metas e previsões também.',
    'Procure um profissional antes de começar se você tem doença crônica, está grávida ou amamentando, tem histórico de transtorno alimentar, usa medicamentos que afetam o apetite ou o peso, ou sente dor durante os exercícios.',
    'Menores de 18 anos devem ter acompanhamento: o corpo está em crescimento e não deve passar por dietas agressivas.'] },
];

export const guiaPorId = id => GUIAS.find(g => g.id === id);

/**
 * Seleciona dicas relevantes. ctx: { metas, totaisHoje, media14, protPorKg, intervalo, plato, objetivo, sessoes14, tendencia, menor, pesoAtual }
 */
export function dicasContextuais(ctx) {
  const d = [];
  const add = (id, motivo) => { if (!d.find(x => x.id === id)) d.push({ id, motivo }); };
  if (ctx.protPorKg != null && ctx.protPorKg > 0 && ctx.protPorKg < 1.4) add('proteina', `Sua proteína média está em ${ctx.protPorKg.toFixed(1).replace('.', ',')} g/kg, abaixo da faixa de 1,6 a 2,2.`);
  if (ctx.plato && ctx.plato.plato) { add('sono', 'Seu peso está estável há semanas. Sono e estresse pesam muito aqui.'); add('deficit', 'Platô: revise a precisão dos registros antes de cortar mais calorias.'); }
  if (ctx.intervaloLongo) add('fome', 'Você teve intervalos longos entre refeições.');
  if (ctx.acucarAlto) add('acucar', 'Açúcar ou bebidas açucaradas passaram do limite recentemente.');
  if (ctx.sessoes14 != null && ctx.sessoes14 < 2) add('progressao', 'Poucos treinos nas últimas duas semanas: consistência vem antes de qualquer ajuste.');
  if (ctx.sessoes14 >= 10) add('deload', 'Muitos treinos seguidos. Considere uma semana de deload.');
  if (ctx.objetivo === 'perder') add('deficit', 'Seu objetivo é perder gordura.');
  if (ctx.objetivo === 'ganhar') add('superavit', 'Seu objetivo é ganhar massa.');
  if (ctx.tendencia && ctx.tendencia.ok && ctx.pesoAtual && Math.abs(ctx.tendencia.kgPorSemana) / ctx.pesoAtual > 0.01) add('deficit', 'O peso está mudando mais de 1% por semana: rápido demais para a maioria das pessoas.');
  if (ctx.menor) add('saude', 'Menores de 18 anos precisam de acompanhamento profissional.');
  add('hidratacao', 'Hidratação ajuda treino, fome e disposição.');
  add('medidas', 'Medir sempre do mesmo jeito deixa a tendência mais confiável.');
  return d;
}
