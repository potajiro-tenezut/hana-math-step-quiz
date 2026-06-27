import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuizApp } from "../features/quiz/QuizApp";

beforeEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

async function startQuiz() {
  render(<QuizApp />);
  await userEvent.click(screen.getByRole("button", { name: "全範囲ランダム" }));
}

async function clickCorrect() {
  const correct = document.querySelector<HTMLButtonElement>('[data-correct="true"]');
  if (!correct) throw new Error("correct choice not found");
  await userEvent.click(correct);
}

describe("QuizApp", () => {
  it("shows a question and three choices", async () => {
    await startQuiz();
    expect(screen.getByText(/問 ・ ステップ/)).toBeInTheDocument();
    expect(within(screen.getByLabelText("次に行うべき打ち手")).getAllByRole("button")).toHaveLength(3);
  });

  it("shows a wrong reason and keeps choices available", async () => {
    await startQuiz();
    const buttons = within(screen.getByLabelText("次に行うべき打ち手")).getAllByRole("button");
    const wrong = buttons.find((button) => button.getAttribute("data-correct") === "false") ?? buttons[0];
    await userEvent.click(wrong);
    expect(await screen.findByText(/もう一度|正解/)).toBeInTheDocument();
    if (screen.queryByText("× もう一度")) {
      expect(screen.getByRole("status")).toHaveTextContent(/操作|式|条件|符号|両辺/);
    }
  });

  it("advances after correct answer", async () => {
    await startQuiz();
    await clickCorrect();
    expect(await screen.findByText(/2\/10問|ステップ 2\//)).toBeInTheDocument();
  });

  it("shows timeout route", async () => {
    vi.useFakeTimers();
    render(<QuizApp />);
    fireEvent.click(screen.getByRole("button", { name: "全範囲ランダム" }));
    act(() => {
      vi.advanceTimersByTime(20_500);
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText("時間切れ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "正しい手順で進む" })).toBeInTheDocument();
    vi.useRealTimers();
  });
});
