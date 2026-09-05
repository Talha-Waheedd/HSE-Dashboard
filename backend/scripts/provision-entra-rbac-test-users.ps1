[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$TenantId = '87f28e25-06cc-426e-b761-a7092aa8084a',
  [switch]$RotatePasswords
)

$ErrorActionPreference = 'Stop'
$requiredCommands = @('Connect-MgGraph', 'Get-MgDomain', 'Get-MgUser', 'New-MgUser', 'Update-MgUser')
$missingCommands = $requiredCommands | Where-Object { -not (Get-Command $_ -ErrorAction SilentlyContinue) }
if ($missingCommands.Count -gt 0) {
  throw "Microsoft Graph PowerShell is required. Install it with: Install-Module Microsoft.Graph -Scope CurrentUser"
}

Connect-MgGraph -TenantId $TenantId -Scopes @('User.ReadWrite.All', 'Domain.Read.All') -NoWelcome

$applicationDomain = 'cbl.com'
$verifiedDomain = Get-MgDomain -DomainId $applicationDomain -ErrorAction SilentlyContinue
if (-not $verifiedDomain -or -not $verifiedDomain.IsVerified) {
  throw "The application-side test users use @$applicationDomain, but that domain is not verified in tenant $TenantId. Update the application users only after confirming the tenant's verified UPN domain."
}

$userSpecs = @(
  @{ UserPrincipalName = 'test.adm.manager@cbl.com'; DisplayName = 'Test ADM Manager' },
  @{ UserPrincipalName = 'test.esd.manager@cbl.com'; DisplayName = 'Test ESD Manager' },
  @{ UserPrincipalName = 'test.prd.manager@cbl.com'; DisplayName = 'Test PRD Manager' },
  @{ UserPrincipalName = 'test.stores.manager@cbl.com'; DisplayName = 'Test Stores Manager' },
  @{ UserPrincipalName = 'test.hse.manager@cbl.com'; DisplayName = 'Test HSE Manager' }
)

function New-TemporaryPassword {
  $passwordBytes = New-Object byte[] 18
  $randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $randomGenerator.GetBytes($passwordBytes)
  } finally {
    $randomGenerator.Dispose()
  }
  $random = [Convert]::ToBase64String($passwordBytes)
  return ($random -replace '[+/=]', 'x') + 'aA1!'
}

$results = foreach ($spec in $userSpecs) {
  $upn = $spec.UserPrincipalName
  $escapedUpn = $upn.Replace("'", "''")
  $existing = Get-MgUser -Filter "userPrincipalName eq '$escapedUpn'" -ConsistencyLevel eventual -ErrorAction Stop
  $password = $null
  $created = $false

  if (-not $existing) {
    $password = New-TemporaryPassword
    if ($PSCmdlet.ShouldProcess($upn, 'Create Microsoft Entra test user')) {
      $passwordProfile = @{
        Password = $password
        ForceChangePasswordNextSignIn = $true
      }
      $existing = New-MgUser `
        -AccountEnabled:$true `
        -DisplayName $spec.DisplayName `
        -MailNickname ($upn.Split('@')[0] -replace '[^a-zA-Z0-9]', '') `
        -UserPrincipalName $upn `
        -PasswordProfile $passwordProfile
      $created = $true
    }
  } elseif ($RotatePasswords) {
    $password = New-TemporaryPassword
    if ($PSCmdlet.ShouldProcess($upn, 'Rotate Microsoft Entra temporary password')) {
      Update-MgUser -UserId $existing.Id -PasswordProfile @{
        Password = $password
        ForceChangePasswordNextSignIn = $true
      }
    }
  }

  [pscustomobject]@{
    UserPrincipalName = $upn
    ObjectId = $existing.Id
    TemporaryPassword = if ($password) { $password } else { 'UNCHANGED_EXISTING_PASSWORD' }
    Created = $created
  }
}

$results | ConvertTo-Json -Depth 4
