package com.bss.dashboard.terminal.domain;

/**
 * 终端归属状态。
 */
public enum TerminalOwnershipStatus {

    /**
     * 已完成人员关联。
     */
    BOUND,

    /**
     * 已上报手机号，但尚未归属到人员档案。
     */
    PENDING_CLAIM,

    /**
     * 未提供足够身份线索。
     */
    ANONYMOUS
}
