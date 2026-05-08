// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DocumentRegistry
 * @notice Вебсистема контролю цілісності електронних документів на базі смарт-контрактів.
 *         Дозволяє реєструвати SHA-256 хеші документів у блокчейні з комісією,
 *         перевіряти їх автентичність та відкликати неактуальні документи.
 * @dev    Використовує AccessControl від OpenZeppelin для мульти-адмін системи.
 */
contract DocumentRegistry is AccessControl {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Document {
        bytes32 docHash;
        uint256 timestamp;
        address author;
        bool exists;
    }

    mapping(bytes32 => Document) public documents;
    uint256 public registrationFee;
    uint256 public totalDocuments;

    event DocumentRegistered(
        bytes32 indexed docHash,
        uint256 timestamp,
        address indexed author,
        uint256 fee
    );

    event DocumentRevoked(
        bytes32 indexed docHash,
        uint256 timestamp,
        address indexed author
    );

    event FeeChanged(
        uint256 oldFee,
        uint256 newFee,
        address indexed changedBy
    );

    event Withdrawal(
        address indexed admin,
        uint256 amount,
        uint256 timestamp
    );

    // ─── Конструктор ───────────────────────────────────────
    /**
     * @param _initialFee Початкова комісія за реєстрацію (у wei)
     */
    constructor(uint256 _initialFee) {
        registrationFee = _initialFee;

        // Хто деплоїть — отримує обидві ролі
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ─── Реєстрація документа ──────────────────────────────
    /**
     * @notice Реєструє хеш документа в блокчейні. Потребує оплати комісії.
     * @param _docHash SHA-256 хеш документа (bytes32)
     */
    function registerDocument(bytes32 _docHash) external payable {
        require(!documents[_docHash].exists, "Document already registered");
        require(msg.value >= registrationFee, "Insufficient fee");

        documents[_docHash] = Document({
            docHash: _docHash,
            timestamp: block.timestamp,
            author: msg.sender,
            exists: true
        });

        totalDocuments++;

        emit DocumentRegistered(_docHash, block.timestamp, msg.sender, msg.value);

        // Повернення надлишку (якщо надіслали більше за комісію)
        uint256 excess = msg.value - registrationFee;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
    }

    // ─── Перевірка документа ───────────────────────────────
    /**
     * @notice Перевіряє, чи зареєстрований документ. View-функція, без gas.
     * @param _docHash SHA-256 хеш документа
     * @return isRegistered Чи існує документ
     * @return timestamp Час реєстрації (Unix)
     * @return author Адреса автора
     */
    function verifyDocument(
        bytes32 _docHash
    )
        external
        view
        returns (bool isRegistered, uint256 timestamp, address author)
    {
        Document memory doc = documents[_docHash];
        return (doc.exists, doc.timestamp, doc.author);
    }

    // ─── Відкликання документа ─────────────────────────────
    /**
     * @notice Відкликає (деактивує) документ. Лише автор документа.
     * @param _docHash SHA-256 хеш документа
     */
    function revokeDocument(bytes32 _docHash) external {
        Document storage doc = documents[_docHash];
        require(doc.exists, "Document not found");
        require(doc.author == msg.sender, "Only author can revoke");

        doc.exists = false;
        totalDocuments--;

        emit DocumentRevoked(_docHash, block.timestamp, msg.sender);
    }

    // ─── Адмін: вивід коштів ──────────────────────────────
    /**
     * @notice Виводить вказану суму з балансу контракту. Лише адміни.
     * @param _amount Сума у wei
     */
    function withdraw(uint256 _amount) external onlyRole(ADMIN_ROLE) {
        require(_amount > 0, "Amount must be > 0");
        require(address(this).balance >= _amount, "Insufficient balance");

        payable(msg.sender).transfer(_amount);

        emit Withdrawal(msg.sender, _amount, block.timestamp);
    }

    // ─── Адмін: зміна комісії ─────────────────────────────
    /**
     * @notice Змінює розмір комісії за реєстрацію. Лише адміни.
     * @param _newFee Нова комісія у wei
     */
    function setFee(uint256 _newFee) external onlyRole(ADMIN_ROLE) {
        uint256 oldFee = registrationFee;
        registrationFee = _newFee;

        emit FeeChanged(oldFee, _newFee, msg.sender);
    }

    // ─── View-функції ─────────────────────────────────────
    /**
     * @notice Повертає баланс контракту (накопичені комісії). View, без gas.
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Перевіряє, чи є адреса адміном.
     * @param _account Адреса для перевірки
     */
    function isAdmin(address _account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, _account);
    }

    /**
     * @notice Перевіряє, чи є адреса суперадміном (може додавати/видаляти адмінів).
     * @param _account Адреса для перевірки
     */
    function isSuperAdmin(address _account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _account);
    }
}
