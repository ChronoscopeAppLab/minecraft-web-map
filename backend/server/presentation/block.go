// Copyright (C) 2021 Chronoscope. All rights reserved.

package presentation

type Block struct {
	Altitude int    `json:"altitude"`
	BlockId  string `json:"block"`
}

func GetBlockAndCoord(dimen string, x, z int) *Block {
	if dimen != "overworld" &&
		dimen != "nether" &&
		dimen != "end" {
		dimen = "overworld"
	}

	return requetBlockInfo(dimen, x, z)
}
