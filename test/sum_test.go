package test

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSum(t *testing.T) {
	type TestCase struct {
		num1     int
		num2     int
		expected int
	}

	t.Run("Sum of two numbers tests", func(t *testing.T) {
		tests := []TestCase{
			{num1: 1, num2: 3, expected: 4},
			{num1: 10, num2: 20, expected: 30},
			{num1: 3, num2: 9, expected: 12},
		}

		for _, test := range tests {
			ans := Add(test.num1, test.num2)
			assert.Equal(t, test.expected, ans)
		}
	})

}
