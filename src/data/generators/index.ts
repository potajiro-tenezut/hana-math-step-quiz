import { QuestionGenerator, QuestionFlow, UnitGroup, unitLabels } from "../../domain/question/types";
import { SeededRandom } from "../../lib/random/seededRandom";
import { divisors, factorLatex, gcd, isPrime, lcm } from "../../lib/math/numberTheory";
import { frac, fracLatex } from "../../lib/math/fraction";
import { radicalLatex, simplifyRadical } from "../../lib/math/radical";
import { choice, makeQuestion, nonZero, signed, step, term } from "./helpers";

type Gen = (random: SeededRandom, seed: string, type: string) => QuestionFlow;

function register(
  type: string,
  unitId: string,
  unitName: string,
  unitGroup: UnitGroup,
  label: string,
  generateFlow: Gen,
): QuestionGenerator {
  return { type, unitId, unitName, unitGroup, label, generate: (seed) => generateFlow(new SeededRandom(`${type}:${seed}`), seed, type) };
}

function oneStepQuestion(
  random: SeededRandom,
  seed: string,
  type: string,
  unitId: string,
  unitGroup: UnitGroup,
  promptText: string,
  stateLatex: string,
  correctLabel: string,
  afterLatex: string,
  explanation: string,
  wrongs: [string, string],
  parameters: Record<string, string | number | boolean>,
): QuestionFlow {
  const s = step(
    random,
    "s1",
    stateLatex,
    choice("c", correctLabel, true),
    choice("w1", wrongs[0], false, "操作する数や符号の扱いが、現在の式の条件と合っていません。"),
    choice("w2", wrongs[1], false, "一部の項だけを処理しており、同じ操作を両辺または全体へ適用できていません。"),
    afterLatex,
    explanation,
    true,
  );
  return makeQuestion({
    seed,
    type,
    unitId,
    unitName: unitLabels[unitGroup],
    unitGroup,
    promptText,
    initialStateLatex: stateLatex,
    steps: [s],
    finalAnswerLatex: afterLatex,
    parameters,
  });
}

function divisorGenerator(kind: string): Gen {
  return (r, seed, type) => {
    if (kind === "prime-range") {
      const start = r.int(20, 70);
      const end = start + r.int(12, 18);
      const primes = Array.from({ length: end - start + 1 }, (_, i) => start + i).filter(isPrime);
      return oneStepQuestion(
        r,
        seed,
        type,
        "unit-9",
        "divisors",
        `${start}から${end}までの整数から素数をすべて選ぶ`,
        `${start}\\le n\\le ${end}`,
        `${start}から${end}までの各数を、2、3、5、7など割り切れる小さい素数で順に確かめる`,
        primes.join(", "),
        `割り切れる数を持たない ${primes.join(", ")} が素数です。`,
        [`偶数を除いた数をすべて素数として選ぶ`, `${start}と${end}だけを割れるか調べる`],
        { start, end, primes: primes.join(",") },
      );
    }
    if (kind === "factorize") {
      const n = r.pick([60, 72, 84, 108, 126, 180, 252, 300, 420]);
      return oneStepQuestion(
        r,
        seed,
        type,
        "unit-9",
        "divisors",
        `${n}を素因数分解する`,
        `${n}`,
        `${n}を小さい素数から順に割り、割った素数を指数でまとめる`,
        `${n}=${factorLatex(n)}`,
        `${n}を素数だけの積にすると ${factorLatex(n)} です。`,
        [`${n}を偶数だけで割れるところまで割る`, `最後に残った合成数をそのまま答えに含める`],
        { n },
      );
    }
    if (kind === "gcd-lcm") {
      const a = r.pick([36, 42, 48, 54, 60, 72]);
      const b = r.pick([56, 63, 72, 84, 90, 96]);
      return oneStepQuestion(
        r,
        seed,
        type,
        "unit-9",
        "divisors",
        `${a}と${b}の最大公約数と最小公倍数を求める`,
        `${a},\\ ${b}`,
        `${a}と${b}を素因数分解し、共通する素因数の小さい指数を最大公約数、大きい指数を最小公倍数に使う`,
        `最大公約数=${gcd(a, b)},\\ 最小公倍数=${lcm(a, b)}`,
        `共通部分から最大公約数、全体を覆う指数から最小公倍数を作ります。`,
        [`共通しない素因数だけで最大公約数を作る`, `2つの数を足して最小公倍数にする`],
        { a, b, gcd: gcd(a, b), lcm: lcm(a, b) },
      );
    }
    if (kind === "factored-gcd-lcm") {
      const a = r.pick([2 * 3 * 49, 2 * 2 * 5 * 7, 3 * 3 * 5 * 11]);
      const b = r.pick([4 * 7, 2 * 5 * 5, 3 * 5 * 11]);
      return oneStepQuestion(
        r,
        seed,
        type,
        "unit-9",
        "divisors",
        `素因数分解された2数の最大公約数と最小公倍数を求める`,
        `${factorLatex(a)}\\ と\\ ${factorLatex(b)}`,
        `同じ素数について、指数の小さい方を最大公約数、大きい方を最小公倍数に採用する`,
        `最大公約数=${gcd(a, b)},\\ 最小公倍数=${lcm(a, b)}`,
        `指数を比べると、最大公約数は ${gcd(a, b)}、最小公倍数は ${lcm(a, b)} です。`,
        [`指数をすべて足して最大公約数を作る`, `片方にある素数だけで最小公倍数を作る`],
        { a, b },
      );
    }
    const g = r.pick([6, 8, 10, 12]);
    const m = g * r.pick([12, 18, 21, 30]);
    const k = m / g;
    const pairs = divisors(k)
      .map((x) => [x, k / x])
      .filter(([x, y]) => gcd(x, y) === 1)
      .map(([x, y]) => `${g * x},${g * y}`);
    return oneStepQuestion(
      r,
      seed,
      type,
      "unit-9",
      "divisors",
      `最大公約数が${g}、最小公倍数が${m}となる2数を求める`,
      `G=${g},\\ L=${m}`,
      `2数を${g}a, ${g}bとおき、ab=${m / g}でaとbが互いに素になる組を探す`,
      pairs.join("\\quad "),
      `最大公約数を外すと、残りの2数は互いに素で積が ${k} になります。`,
      [`ab=${m}として組を探す`, `aとbに共通因数がある組もすべて含める`],
      { g, m, pairs: pairs.join(";") },
    );
  };
}

function remainderGenerator(kind: string): Gen {
  return (r, seed, type) => {
    if (kind === "single-remainder") {
      const n = r.int(45, 120);
      const rem = r.int(2, 9);
      const target = n - rem;
      const answer = divisors(target).filter((d) => d > rem).join(", ");
      return oneStepQuestion(r, seed, type, "unit-10", "divisors", `${n}を割ると${rem}余る整数をすべて求める`, `${n}=割る数\\times 商+${rem}`, `${n}-${rem}=${target}を作り、${target}の約数のうち${rem}より大きいものを選ぶ`, answer, `余りを引いた ${target} が割る数の倍数です。`, [`${n}の約数をすべて選ぶ`, `${rem}以下の約数も含める`], { n, rem, target });
    }
    if (kind === "same-remainder-lcm") {
      const nums = [12, 16, 18];
      const rem = r.pick([5, 7, 9, 11]);
      const base = nums.reduce(lcm);
      let ans = rem;
      while (ans < 100) ans += base;
      return oneStepQuestion(
        r,
        seed,
        type,
        "unit-10",
        "divisors",
        `${nums.join("、")}のどの数で割っても${rem}余る、最小の3桁の整数`,
        `n-${rem}\\ は\\ ${nums.join(",")}\\ すべてで割り切れる`,
        `${nums.join("、")}の最小公倍数${base}を求め、${base}+${rem}, ${base}\\times2+${rem}, ... の順に3桁になる最初の数を探す`,
        `${ans}`,
        `${base}ごとに同じ余りの数が出るので、最小の3桁は ${ans} です。`,
        [`${base}-${rem}, ${base}\\times2-${rem}, ... の順に探す`, `12+16+18=${nums.reduce((a, b) => a + b, 0)}ごとに同じ余りが出ると考える`],
        { rem, ans },
      );
    }
    if (kind === "two-remainders") {
      const a = r.int(60, 120);
      const b = r.int(130, 230);
      const ra = r.int(3, 12);
      const rb = r.int(4, 15);
      const d = gcd(a - ra, b - rb);
      const answer = divisors(d).filter((x) => x > Math.max(ra, rb)).join(", ");
      return oneStepQuestion(r, seed, type, "unit-10", "divisors", `${a}を割ると${ra}余り、${b}を割ると${rb}余る整数を求める`, `${a}-${ra},\\ ${b}-${rb}`, `${a}-${ra}=${a - ra}と${b}-${rb}=${b - rb}の公約数から、余りより大きいものを選ぶ`, answer || "該当なし", `割る数は ${a - ra} と ${b - rb} の共通の約数です。`, [`${a}と${b}の公約数を選ぶ`, `余りより小さい公約数も含める`], { a, b, ra, rb });
    }
    if (kind === "weekday") {
      const offset = 31 + r.int(20, 30) - 1;
      const days = ["水", "木", "金", "土", "日", "月", "火"];
      const ans = days[offset % 7];
      return oneStepQuestion(r, seed, type, "unit-10", "divisors", `3月1日が水曜日の年の4月${offset - 30}日の曜日`, `${offset}\\ 日後`, `3月1日から4月${offset - 30}日までの日数差${offset}を7で割り、余りだけ水曜日から進める`, `${ans}曜日`, `${offset}=7\\times${Math.floor(offset / 7)}+${offset % 7} なので、水曜日から${offset % 7}日進みます。`, [`3月と4月の日数をどちらも30日として数える`, `7で割った商だけ曜日を進める`], { offset, ans });
    }
    const rem12 = 9;
    const rem16 = 13;
    const base = lcm(12, 16);
    const candidates = Array.from({ length: 10 }, (_, i) => rem12 + base * i).filter((n) => n % 16 === rem16);
    const ans = candidates.reduce((best, n) => (Math.abs(n - 100) < Math.abs(best - 100) ? n : best), candidates[0]);
    return oneStepQuestion(
      r,
      seed,
      type,
      "unit-10",
      "divisors",
      `12で割ると9余り、16で割ると13余る数のうち、100に最も近い整数`,
      `12で割ると9余る\\quad 16で割ると13余る`,
      `まず9, 21, 33, 45, ... と12ずつ増やして、16で割ると13余る数を見つける`,
      `${ans}`,
      `9から12ずつ増やして調べると条件に合う数が見つかります。同じ形の数は48ごとに出るので、100に最も近いものを選びます。`,
      [`9+13=22として、22を答えにする`, `12+16=28ずつ増やせば同じ余りになると考える`],
      { ans },
    );
  };
}

function radicalGenerator(kind: string): Gen {
  return (r, seed, type) => {
    const a = r.int(2, 8);
    if (kind === "sqrt-square") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `\\sqrt{(-${a})^2}を簡単にする`, `\\sqrt{(-${a})^2}`, `\\sqrt{(-${a})^2}=|-${a}|と考え、絶対値を取って正の${a}にする`, `${a}`, `平方根は0以上なので、負の数の2乗の平方根は絶対値です。`, [`-${a}のまま答える`, `${a * a}のまま答える`], { a });
    if (kind === "decimal-root") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `\\sqrt{0.${a * a < 10 ? `0${a * a}` : a * a}}を簡単にする`, `\\sqrt{\\frac{${a * a}}{10000}}`, `小数を分数に直し、\\sqrt{${a * a}}/${100}=${a}/100にする`, fracLatex(frac(a, 100)), `小数の平方根は分数に直すと安全に整理できます。`, [`\\frac{${a * a}}{100}`, `\\frac{${a}}{10}`], { a });
    if (kind === "root-product") {
      const b = r.pick([12, 20, 27, 45, 75]);
      const simp = radicalLatex(simplifyRadical(a * b));
      return oneStepQuestion(r, seed, type, "unit-11", "radicals", `\\sqrt{${a}}\\times\\sqrt{${b}}を計算する`, `\\sqrt{${a}}\\times\\sqrt{${b}}`, `根号の中どうしを掛けて\\sqrt{${a * b}}にし、平方因数を外へ出す`, simp, `\\sqrt{a}\\sqrt{b}=\\sqrt{ab} を使います。`, [`\\sqrt{${a + b}}にする`, `${a}\\sqrt{${b}}にする`], { a, b });
    }
    if (kind === "root-mul-div") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `\\sqrt{10}\\times\\sqrt{35}\\div\\sqrt{14}を計算する`, `\\sqrt{10}\\times\\sqrt{35}\\div\\sqrt{14}`, `根号の中を\\frac{10\\times35}{14}=25とまとめ、\\sqrt{25}=5にする`, `5`, `掛け算と割り算を根号の中でまとめると25になります。`, [`\\sqrt{10+35-14}にする`, `分母の\\sqrt{14}を無視する`], { fixed: true });
    if (kind === "like-radicals") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `${a}\\sqrt{3}-\\sqrt{3}をまとめる`, `${a}\\sqrt{3}-\\sqrt{3}`, `同じ\\sqrt{3}を1つの文字のように見て、係数${a}-1を計算する`, `${a - 1}\\sqrt{3}`, `根号部分が同じなので係数だけを引きます。`, [`${a - 1}\\sqrt{0}`, `${a}\\sqrt{2}`], { a });
    if (kind === "simplify-add") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `\\sqrt{75}-\\sqrt{27}-\\sqrt{12}を計算する`, `\\sqrt{75}-\\sqrt{27}-\\sqrt{12}`, `それぞれ5\\sqrt3, 3\\sqrt3, 2\\sqrt3に直し、係数5-3-2を計算する`, `0`, `根号の中を簡単にして同類項としてまとめます。`, [`\\sqrt{36}`, `5\\sqrt3-\\sqrt{39}`], { fixed: true });
    if (kind === "sum-difference") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `(2\\sqrt3+\\sqrt2)(2\\sqrt3-\\sqrt2)を展開する`, `(2\\sqrt3+\\sqrt2)(2\\sqrt3-\\sqrt2)`, `(A+B)(A-B)=A^2-B^2として、(2\\sqrt3)^2-(\\sqrt2)^2を計算する`, `10`, `12-2=10です。`, [`中項を残して計算する`, `12+2=14にする`], { fixed: true });
    if (kind === "distribute-root") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `\\sqrt3(\\sqrt{60}+2\\sqrt3-5\\sqrt{15})を展開する`, `\\sqrt3(\\sqrt{60}+2\\sqrt3-5\\sqrt{15})`, `外の\\sqrt3を、かっこ内の3項すべてに掛けて\\sqrt{180}+6-5\\sqrt{45}にする`, `6\\sqrt5+6-15\\sqrt5=-9\\sqrt5+6`, `3項すべてへ分配してから根号を簡単にします。`, [`最初の項だけに\\sqrt3を掛ける`, `\\sqrt3をかっこの中へ足す`], { fixed: true });
    if (kind === "binomial-square") return oneStepQuestion(r, seed, type, "unit-11", "radicals", `(3\\sqrt5-2\\sqrt3)^2を展開する`, `(3\\sqrt5-2\\sqrt3)^2`, `A=3\\sqrt5, B=2\\sqrt3としてA^2-2AB+B^2を計算する`, `57-12\\sqrt{15}`, `中項の -2AB を忘れずに入れます。`, [`45+12=57だけにする`, `57-6\\sqrt{15}にする`], { fixed: true });
    return oneStepQuestion(r, seed, type, "unit-11", "radicals", `(3\\sqrt2+\\sqrt3)(\\sqrt2-2\\sqrt3)を展開する`, `(3\\sqrt2+\\sqrt3)(\\sqrt2-2\\sqrt3)`, `前の2項を後ろの2項それぞれに掛け、6-6\\sqrt6+\\sqrt6-6をまとめる`, `-5\\sqrt6`, `4つの積を作って同類項をまとめます。`, [`6-6=0だけにする`, `-7\\sqrt6にする`], { fixed: true });
  };
}

function rationalizeGenerator(kind: string): Gen {
  return (r, seed, type) => {
    if (kind === "single-root-denominator") return oneStepQuestion(r, seed, type, "unit-12", "radicals", `\\frac{\\sqrt3}{\\sqrt7}を有理化する`, `\\frac{\\sqrt3}{\\sqrt7}`, `分母と分子の両方に\\sqrt7を掛け、分母の\\sqrt7\\times\\sqrt7を7にする`, `\\frac{\\sqrt{21}}{7}`, `分母だけでなく分子にも同じ数を掛けます。`, [`分母だけに\\sqrt7を掛ける`, `\\frac{\\sqrt3}{7}にする`], { fixed: true });
    if (kind === "several-fractions") return oneStepQuestion(r, seed, type, "unit-12", "radicals", `\\frac1{\\sqrt3}-\\frac1{\\sqrt{12}}+\\frac1{\\sqrt{27}}を計算する`, `\\frac1{\\sqrt3}-\\frac1{\\sqrt{12}}+\\frac1{\\sqrt{27}}`, `各分母を有理化して、\\frac{\\sqrt3}{3}-\\frac{\\sqrt3}{6}+\\frac{\\sqrt3}{9}を作る`, `\\frac{5\\sqrt3}{18}`, `有理化後に\\sqrt3の係数を通分して計算します。`, [`分母だけを3,12,27にする`, `\\frac{\\sqrt3}{3}-\\frac{\\sqrt{12}}{12}+\\frac{\\sqrt{27}}{27}で止める`], { fixed: true });
    if (kind === "numerator-root") return oneStepQuestion(r, seed, type, "unit-12", "radicals", `\\frac{\\sqrt6-\\sqrt2}{\\sqrt3}を計算する`, `\\frac{\\sqrt6-\\sqrt2}{\\sqrt3}`, `分母と分子に\\sqrt3を掛け、\\frac{\\sqrt{18}-\\sqrt6}{3}=\\frac{3\\sqrt2-\\sqrt6}{3}にする`, `\\frac{3\\sqrt2-\\sqrt6}{3}`, `分子の\\sqrt{18}も簡単にします。`, [`分母だけを3にする`, `\\sqrt2-\\sqrt{\\frac23}にする`], { fixed: true });
    if (kind === "conjugate-denominator") return oneStepQuestion(r, seed, type, "unit-12", "radicals", `\\frac5{2-\\sqrt3}を有理化する`, `\\frac5{2-\\sqrt3}`, `分母と分子に共役な2+\\sqrt3を掛け、分母を4-3=1にする`, `10+5\\sqrt3`, `二項式の分母は共役な式を掛けます。`, [`2-\\sqrt3をもう一度掛ける`, `分子だけに2+\\sqrt3を掛ける`], { fixed: true });
    if (kind === "both-binomial") return oneStepQuestion(r, seed, type, "unit-12", "radicals", `\\frac{2\\sqrt3-\\sqrt2}{2\\sqrt3+\\sqrt2}を有理化する`, `\\frac{2\\sqrt3-\\sqrt2}{2\\sqrt3+\\sqrt2}`, `分母と分子に2\\sqrt3-\\sqrt2を掛け、分母を12-2=10にする`, `\\frac{7-2\\sqrt6}{5}`, `分子は(2\\sqrt3-\\sqrt2)^2、分母は差の積で計算します。`, [`分母と分子に2\\sqrt3+\\sqrt2を掛ける`, `分母を12+2=14にする`], { fixed: true });
    return oneStepQuestion(r, seed, type, "unit-12", "radicals", `\\frac{\\sqrt5}{\\sqrt5-\\sqrt3}-\\frac{\\sqrt3}{\\sqrt5+\\sqrt3}を計算する`, `\\frac{\\sqrt5}{\\sqrt5-\\sqrt3}-\\frac{\\sqrt3}{\\sqrt5+\\sqrt3}`, `1つ目に\\sqrt5+\\sqrt3、2つ目に\\sqrt5-\\sqrt3を掛け、それぞれの分母を5-3=2にする`, `1+\\sqrt{15}`, `それぞれ共役な式で有理化してから差を取ります。`, [`両方に同じ\\sqrt5+\\sqrt3を掛ける`, `分母を5+3=8にする`], { fixed: true });
  };
}

function expressionGenerator(kind: string): Gen {
  return (r, seed, type) => {
    const a = -r.int(2, 6);
    if (kind === "negative-substitution") return oneStepQuestion(r, seed, type, "unit-13", "expressions", `a=${a}のとき、a^2+3a+5の値`, `a^2+3a+5`, `aに${a}を代入し、(${a})^2+3\\times(${a})+5を計算する`, `${a * a + 3 * a + 5}`, `負の数の2乗は正になります。`, [`-${a * a}+3\\times${a}+5にする`, `a^2だけ代入して止める`], { a });
    if (kind === "two-variables") return oneStepQuestion(r, seed, type, "unit-13", "expressions", `x=-5、y=-3のとき、-x(3x+y^2)の値`, `-x(3x+y^2)`, `x=-5, y=-3を代入し、-(-5)(3\\times(-5)+(-3)^2)を計算する`, `-30`, `かっこの中は -15+9=-6 です。`, [`xの前の-を無視する`, `y^2を-9にする`], { fixed: true });
    if (kind === "difference-squares") return oneStepQuestion(r, seed, type, "unit-13", "expressions", `a+b=\\sqrt5+2、a-b=\\sqrt5-2のとき、a^2-b^2`, `a^2-b^2`, `a^2-b^2=(a+b)(a-b)として、(\\sqrt5+2)(\\sqrt5-2)を計算する`, `1`, `和と差の積なので5-4=1です。`, [`(a+b)^2-(a-b)^2を計算する`, `5+4=9にする`], { fixed: true });
    if (kind === "sum-square") return oneStepQuestion(r, seed, type, "unit-13", "expressions", `x+y=4、xy=-5のとき、x^2+y^2`, `x^2+y^2`, `x^2+y^2=(x+y)^2-2xyとして、4^2-2\\times(-5)を計算する`, `26`, `16+10=26です。`, [`4^2+2\\times(-5)にする`, `(x+y)^2だけで答える`], { fixed: true });
    if (kind === "half-sum") return oneStepQuestion(r, seed, type, "unit-13", "expressions", `a=\\frac{\\sqrt5+\\sqrt3}{2}, b=\\frac{\\sqrt5-\\sqrt3}{2}のとき、a^2+b^2`, `a^2+b^2`, `a+b=\\sqrt5, ab=\\frac12を求め、a^2+b^2=(a+b)^2-2abを使う`, `4`, `5-1=4です。`, [`a+b=\\sqrt8として計算する`, `2abを足す`], { fixed: true });
    return oneStepQuestion(r, seed, type, "unit-13", "expressions", `x=\\sqrt5+2のとき、x^2+\\frac1{x^2}`, `x^2+\\frac1{x^2}`, `\\frac1x=\\sqrt5-2を求め、x+\\frac1x=2\\sqrt5として二乗から2を引く`, `18`, `(x+1/x)^2=x^2+2+1/x^2 です。`, [`1/xを\\sqrt5+2のままにする`, `二乗して2を足す`], { fixed: true });
  };
}

function linearGenerator(kind: string): Gen {
  return (r, seed, type) => {
    if (kind === "basic") {
      const x = r.int(-5, 8);
      const a = nonZero(r, 2, 7);
      const b = r.int(-12, 12);
      const c = a * x + b;
      const state = `${term(a, "x")}${signed(b)}=${c}`;
      const after = `x=${x}`;
      const s1 = step(r, "s1", state, choice("c", `左辺の定数項${b}を右辺へ移し、符号を変えて${-b >= 0 ? "+" : ""}${-b}にする`, true), choice("w1", `左辺の定数項${b}を右辺へ移しても符号を変えない`, false, "移項すると符号が変わります。"), choice("w2", `xの係数${a}を右辺へ足す`, false, "係数は最後に割るために使います。"), `${term(a, "x")}=${c - b}`, `定数項だけを右辺に集めます。`);
      const s2 = step(r, "s2", s1.afterLatex, choice("c", `両辺をxの係数${a}で割り、x=${x}にする`, true), choice("w1", `両辺に${a}を掛ける`, false, "係数を消すには掛けるのではなく割ります。"), choice("w2", `右辺だけを${a}で割る`, false, "方程式では両辺に同じ操作をします。"), after, `両辺を${a}で割ります。`, true);
      return makeQuestion({ seed, type, unitId: "unit-14", unitName: unitLabels.linear, unitGroup: "linear", promptText: `1次方程式 ${state} を解く`, initialStateLatex: state, steps: [s1, s2], finalAnswerLatex: after, parameters: { a, b, c, x } });
    }
    if (kind === "parentheses") return oneStepQuestion(r, seed, type, "unit-14", "linear", `5-7(x+2)=4(3-x)を解く`, `5-7(x+2)=4(3-x)`, `左辺の-7をxと2の両方に、右辺の4を3と-xの両方に分配する`, `5-7x-14=12-4x`, `分配法則を両辺のかっこ全体に使います。`, [`-7をxだけに掛ける`, `右辺の-xに4を掛け忘れる`], { fixed: true });
    if (kind === "decimal") return oneStepQuestion(r, seed, type, "unit-14", "linear", `0.3x-2=0.1+0.15xを解く`, `0.3x-2=0.1+0.15x`, `両辺を100倍して、30x-200=10+15xにする`, `30x-200=10+15x`, `小数を整数に直すと計算ミスを減らせます。`, [`両辺を10倍して3x-2=1+15xにする`, `xの項だけを100倍する`], { fixed: true });
    if (kind === "fraction") return oneStepQuestion(r, seed, type, "unit-14", "linear", `\\frac{x}{4}-\\frac13=\\frac{2x}{3}+3を解く`, `\\frac{x}{4}-\\frac13=\\frac{2x}{3}+3`, `分母4と3の最小公倍数12を両辺に掛け、3x-4=8x+36にする`, `3x-4=8x+36`, `すべての項に12を掛けます。`, [`x/4の項だけに12を掛ける`, `分母を足した7を掛ける`], { fixed: true });
    if (kind === "multi-fraction") return oneStepQuestion(r, seed, type, "unit-14", "linear", `\\frac{x-5}{2}-\\frac{1-x}{3}=-1を解く`, `\\frac{x-5}{2}-\\frac{1-x}{3}=-1`, `分母2と3の最小公倍数6を両辺に掛け、3(x-5)-2(1-x)=-6にする`, `3(x-5)-2(1-x)=-6`, `分子がかっこ全体であることに注意します。`, [`3x-5-2+2x=-6にする`, `右辺だけに6を掛け忘れる`], { fixed: true });
    if (kind === "proportion-a") return oneStepQuestion(r, seed, type, "unit-14", "linear", `x:3=(2x+1):5を解く`, `x:3=(2x+1):5`, `外項と内項の積を等しくして、5x=3(2x+1)にする`, `5x=6x+3`, `比例式は外項の積と内項の積を等しくします。`, [`3x=5(2x+1)にする`, `x+5=3+2x+1にする`], { fixed: true });
    return oneStepQuestion(r, seed, type, "unit-14", "linear", `(5x-2):6=(x-4):3を解く`, `(5x-2):6=(x-4):3`, `外項と内項の積を等しくして、3(5x-2)=6(x-4)にする`, `15x-6=6x-24`, `外側どうし、内側どうしの積を対応させます。`, [`6(5x-2)=3(x-4)にする`, `5x-2+3=6+x-4にする`], { fixed: true });
  };
}

function systemGenerator(kind: string): Gen {
  return (r, seed, type) => {
    if (kind === "substitution") return oneStepQuestion(r, seed, type, "unit-15", "systems", `x=3y+4, 2x+y=1を解く`, `\\begin{cases}x=3y+4\\\\2x+y=1\\end{cases}`, `第2式のxに3y+4を代入し、2(3y+4)+y=1にする`, `6y+8+y=1`, `xがすでにyで表されているので代入します。`, [`第1式に2x+y=1を代入する`, `x=3y+4を2倍せずに足す`], { fixed: true });
    if (kind === "elimination") return oneStepQuestion(r, seed, type, "unit-15", "systems", `4x+5y=-8, x-2y=11を解く`, `\\begin{cases}4x+5y=-8\\\\x-2y=11\\end{cases}`, `第2式の両辺を4倍して4x-8y=44とし、第1式から引いてxを消去する`, `13y=-52`, `xの係数をそろえて引きます。`, [`第2式の左辺だけを4倍する`, `第1式と第2式をそのまま足す`], { fixed: true });
    if (kind === "parentheses") return oneStepQuestion(r, seed, type, "unit-15", "systems", `かっこを含む連立方程式を解く`, `\\begin{cases}2x+3(x+y)=-12\\\\5(x+4y)-y=4\\end{cases}`, `第1式は2x+3x+3y、第2式は5x+20y-yと展開する`, `\\begin{cases}5x+3y=-12\\\\5x+19y=4\\end{cases}`, `両方の式でかっこ内の全項へ分配します。`, [`3をyだけに掛ける`, `5をxだけに掛ける`], { fixed: true });
    if (kind === "fractions") return oneStepQuestion(r, seed, type, "unit-15", "systems", `分数を含む連立方程式を解く`, `\\begin{cases}\\frac{x}{4}+\\frac{2y}{3}=-1\\\\\\frac{x}{2}-\\frac{y}{3}=3\\end{cases}`, `両方の式に12を掛け、第1式を3x+8y=-12、第2式を6x-4y=36にする`, `\\begin{cases}3x+8y=-12\\\\6x-4y=36\\end{cases}`, `分母を払って整数係数にします。`, [`第1式だけに12を掛ける`, `分母の和7を掛ける`], { fixed: true });
    if (kind === "chain") return oneStepQuestion(r, seed, type, "unit-15", "systems", `3x-y=-2x+4y=14を解く`, `3x-y=-2x+4y=14`, `3x-y=14と-2x+4y=14の2本の方程式に分ける`, `\\begin{cases}3x-y=14\\\\-2x+4y=14\\end{cases}`, `同じ値14に等しい2式として扱います。`, [`3x-y=-2x+4yだけを使う`, `3x-y-2x+4y=14にまとめる`], { fixed: true });
    return oneStepQuestion(r, seed, type, "unit-15", "systems", `3元1次連立方程式を解く`, `\\begin{cases}x+y=3\\\\y+z=4\\\\z+x=5\\end{cases}`, `3式をすべて足して、2x+2y+2z=12からx+y+z=6を作る`, `x+y+z=6`, `全体の和を作ると各文字が2回ずつ出ます。`, [`3式を掛け合わせる`, `最初の2式だけを足して答える`], { fixed: true });
  };
}

function quadraticGenerator(kind: string): Gen {
  return (r, seed, type) => {
    if (kind === "factor") {
      const p = r.pick([3, 4, -2, -5]);
      const q = r.pick([-4, -3, 2, 6]);
      const b = -(p + q);
      const c = p * q;
      const state = `x^2${signed(b)}x${signed(c)}=0`;
      return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `${state}を解く`, state, `積が${c}、和が${-b}になる2数${p}と${q}を使い、(x${signed(-p)})(x${signed(-q)})=0にする`, `x=${p},\\ ${q}`, `積が0ならどちらかの因数が0です。`, [`積が${c}だけを見て符号を決める`, `両辺をxで割る`], { p, q, b, c });
    }
    if (kind === "common-factor") return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `x^2-6x=0を解く`, `x^2-6x=0`, `左辺の共通因数xをくくり、x(x-6)=0にする`, `x=0,\\ 6`, `x=0の場合も解に含めます。`, [`両辺をxで割ってx=6だけにする`, `x^2と6xを足す`], { fixed: true });
    if (kind === "perfect-square") return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `x^2-14x+49=0を解く`, `x^2-14x+49=0`, `49=7^2、-14x=-2\\times7\\times xなので、(x-7)^2=0にする`, `x=7`, `完全平方の形です。`, [`(x+7)^2=0にする`, `x=\\pm7にする`], { fixed: true });
    if (kind === "leading-not-one") return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `3x^2-5x-2=0を解く`, `3x^2-5x-2=0`, `積が-6、和が-5になる-6と1を使い、3x^2-6x+x-2=0に分ける`, `(3x+1)(x-2)=0`, `中項を分けると因数分解できます。`, [`(3x-1)(x+2)=0にする`, `3と-2だけをくくる`], { fixed: true });
    if (kind === "square-root") return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `(x-3)^2=25を解く`, `(x-3)^2=25`, `両辺の平方根を考え、x-3=\\pm5にする`, `x=8,\\ -2`, `2乗して25になる数は5と-5です。`, [`x-3=5だけにする`, `x^2-9=25にする`], { fixed: true });
    if (kind === "square-root-shift") return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `(2x+1)^2-7=0を解く`, `(2x+1)^2-7=0`, `左辺の-7を右辺へ移して、(2x+1)^2=7にする`, `2x+1=\\pm\\sqrt7`, `平方根を取る前に2乗の形を単独にします。`, [`(2x+1)^2=-7にする`, `2x+1=7にする`], { fixed: true });
    if (kind === "complete-square") return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `x^2-4x+1=0を平方完成で解く`, `x^2-4x+1=0`, `x^2-4xを(x-2)^2-4に直し、(x-2)^2-3=0にする`, `(x-2)^2=3`, `xの係数-4の半分-2を使います。`, [`(x-4)^2に直す`, `+1を消してx^2-4x=0にする`], { fixed: true });
    if (kind === "substitution-factor") return oneStepQuestion(r, seed, type, "unit-16", "quadratic", `2(x+2)^2-(x+2)-6=0を解く`, `2(x+2)^2-(x+2)-6=0`, `y=x+2と見立てて、2y^2-y-6=0を因数分解する`, `(2y+3)(y-2)=0`, `同じ式を1つの文字として扱います。`, [`x+2を展開してから係数だけ見る`, `y^2-y-6=0にする`], { fixed: true });
    if (kind === "formula") {
      const a = r.pick([1, 2, 5, -3]);
      const b = r.pick([3, -1, -4, 2, 6]);
      const c = r.pick([1, -7, -3, -2]);
      const d = b * b - 4 * a * c;
      const state = `${a === 1 ? "" : a}x^2${signed(b)}x${signed(c)}=0`;
      const after = `x=\\frac{${-b}\\pm\\sqrt{${d}}}{${2 * a}}`;
      return oneStepQuestion(r, seed, type, "unit-17", "quadratic", `${state}を解の公式で解く`, state, `a=${a}、b=${b}、c=${c}と見立てて、x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}に代入する`, after, `係数を公式の対応する場所へ入れます。`, [`分母を2だけにする`, `判別式をb^2+4acにする`], { a, b, c, d });
    }
    return oneStepQuestion(r, seed, type, "unit-17", "quadratic", `x^2+ax+(a-13)=0の解の1つが3であるとき、もう1つの解を求める`, `x^2+ax+(a-13)=0,\\ x=3`, `x=3を代入し、9+3a+a-13=0からa=1を求める`, `x^2+x-12=0`, `まず定数aを決めてから、2次方程式を解きます。`, [`もう1つの解も3とする`, `aを代入せずに因数分解する`], { fixed: true });
  };
}

export const generators: QuestionGenerator[] = [
  register("prime-range", "unit-9", "単元9：約数と倍数①", "divisors", "指定範囲の素数", divisorGenerator("prime-range")),
  register("prime-factorization", "unit-9", "単元9：約数と倍数①", "divisors", "素因数分解", divisorGenerator("factorize")),
  register("gcd-lcm", "unit-9", "単元9：約数と倍数①", "divisors", "最大公約数と最小公倍数", divisorGenerator("gcd-lcm")),
  register("factored-gcd-lcm", "unit-9", "単元9：約数と倍数①", "divisors", "素因数分解済みのGCD/LCM", divisorGenerator("factored-gcd-lcm")),
  register("gcd-lcm-condition", "unit-9", "単元9：約数と倍数①", "divisors", "GCD/LCM条件から2数", divisorGenerator("condition")),
  register("single-remainder-divisor", "unit-10", "単元10：約数と倍数②", "divisors", "余りから割る数", remainderGenerator("single-remainder")),
  register("same-remainder-lcm", "unit-10", "単元10：約数と倍数②", "divisors", "同じ余りとLCM", remainderGenerator("same-remainder-lcm")),
  register("two-remainders-common-divisor", "unit-10", "単元10：約数と倍数②", "divisors", "2つの余り条件", remainderGenerator("two-remainders")),
  register("weekday-mod-seven", "unit-10", "単元10：約数と倍数②", "divisors", "曜日と7の余り", remainderGenerator("weekday")),
  register("nearest-congruence", "unit-10", "単元10：約数と倍数②", "divisors", "余りの条件に合う近い整数", remainderGenerator("nearest")),
  ...["sqrt-square", "decimal-root", "root-product", "root-mul-div", "like-radicals", "simplify-add", "sum-difference", "distribute-root", "binomial-square", "binomial-expand"].map((k) => register(k, "unit-11", "単元11：根号を含む式の計算①", "radicals", k, radicalGenerator(k))),
  ...["single-root-denominator", "several-fractions", "numerator-root", "conjugate-denominator", "both-binomial-rationalize", "two-rationalized-fractions"].map((k) => register(k, "unit-12", "単元12：根号を含む式の計算②", "radicals", k, rationalizeGenerator(k))),
  ...["negative-substitution", "two-variables", "difference-squares", "sum-square", "half-sum", "reciprocal-expression"].map((k) => register(k, "unit-13", "単元13：式の値", "expressions", k, expressionGenerator(k))),
  ...["linear-basic", "linear-parentheses", "linear-decimal", "linear-fraction", "linear-multi-fraction", "proportion-a", "proportion-b"].map((k) => register(k, "unit-14", "単元14：1次方程式・比例式", "linear", k, linearGenerator(k.replace("linear-", "")))),
  ...["system-substitution", "system-elimination", "system-parentheses", "system-fractions", "system-chain", "system-three-variable"].map((k) => register(k, "unit-15", "単元15：連立方程式", "systems", k, systemGenerator(k.replace("system-", "")))),
  ...["quadratic-factor", "quadratic-common-factor", "quadratic-perfect-square", "quadratic-leading-not-one", "quadratic-square-root", "quadratic-square-root-shift", "quadratic-complete-square", "quadratic-substitution-factor", "quadratic-formula", "quadratic-root-parameter"].map((k) => register(k, k.includes("formula") || k.includes("parameter") ? "unit-17" : "unit-16", k.includes("formula") || k.includes("parameter") ? "単元17：2次方程式②" : "単元16：2次方程式①", "quadratic", k, quadraticGenerator(k.replace("quadratic-", "")))),
];

export function getGeneratorsByUnit(unitGroup?: UnitGroup): QuestionGenerator[] {
  return unitGroup ? generators.filter((g) => g.unitGroup === unitGroup) : generators;
}

export function generateSession(seed: string, count = 10, unitGroup?: UnitGroup, reviewTypes: string[] = []): QuestionFlow[] {
  const random = new SeededRandom(seed);
  const source = reviewTypes.length
    ? generators.filter((g) => reviewTypes.includes(g.type))
    : getGeneratorsByUnit(unitGroup);
  const selected: QuestionFlow[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (selected.length < count && guard < count * 50) {
    const pool = random.shuffle(source);
    for (const gen of pool) {
      if (selected.length >= count) break;
      const q = gen.generate(`${seed}:${selected.length}:${guard}`);
      if (!seen.has(q.fingerprint)) {
        validateQuestion(q);
        selected.push(q);
        seen.add(q.fingerprint);
      }
    }
    guard += 1;
  }
  return selected;
}

export function validateQuestion(question: QuestionFlow): void {
  if (question.steps.length === 0) throw new Error(`${question.id}: no steps`);
  question.steps.forEach((s, index) => {
    if (s.choices.length !== 3) throw new Error(`${question.id}: step ${s.id} does not have 3 choices`);
    if (s.choices.filter((c) => c.isCorrect).length !== 1) throw new Error(`${question.id}: step ${s.id} has invalid correct count`);
    if (!s.choices.some((c) => c.id === s.correctChoiceId && c.isCorrect)) throw new Error(`${question.id}: step ${s.id} correct id mismatch`);
    if (index < question.steps.length - 1 && s.afterLatex !== question.steps[index + 1].stateLatex) throw new Error(`${question.id}: afterLatex mismatch`);
  });
}
