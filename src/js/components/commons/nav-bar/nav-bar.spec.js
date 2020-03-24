import React from "react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./nav-bar";
import "@testing-library/jest-dom";
import { render, fireEvent } from "@testing-library/react";

describe("nav-bar component", () => {
  it("shoud call the handleClickMenu after clicking to the button", () => {
    const { getByLabelText, getByTestId } = render(
      <MemoryRouter>
        <Navbar login={false} displayLogin={jest.fn} />
      </MemoryRouter>
    );
    fireEvent.click(getByLabelText("Menu"));
    fireEvent.click(getByTestId("bouton-login"));
  });
});
